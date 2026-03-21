import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST_DIR = 'dist';
const WEB_DIR = join(DIST_DIR, 'ivai2024-web');
const WP_DIR = join(DIST_DIR, 'wordpress-plugin', 'ivai-map-embed');

const webArtifacts = [
    'api',
    'config',
    'css',
    'data',
    'index.html',
    'js',
    'mapa',
    'src',
    'MANUAL_API.md'
];

async function copyArtifacts(list, destination) {
    for (const item of list) {
        await cp(item, join(destination, item), { recursive: true });
    }
}

async function buildWebBundle() {
    await mkdir(WEB_DIR, { recursive: true });
    await copyArtifacts(webArtifacts, WEB_DIR);

    const readme = [
        '# IVAI Web Bundle',
        '',
        'Este paquete contiene el visor web con sus assets y datos para despliegue directo.',
        '',
        'Contenido clave:',
        '- `index.html`',
        '- `css/`, `js/`, `src/`',
        '- `config/`, `data/`, `mapa/`',
        '- `api/update.php`'
    ].join('\n');

    await writeFile(join(WEB_DIR, 'README_BUNDLE.md'), readme, 'utf8');
}

async function buildWordPressBundle() {
    await mkdir(WP_DIR, { recursive: true });
    await cp('src/adapters/wordpress/ivai-wordpress.php', join(WP_DIR, 'ivai-wordpress.php'));
    await cp('src/adapters/wordpress/README.md', join(WP_DIR, 'README.md'));
}

async function writeBuildInfo() {
    const pkgRaw = await readFile('package.json', 'utf8');
    const pkg = JSON.parse(pkgRaw);
    const info = {
        name: pkg.name,
        version: pkg.version,
        builtAt: new Date().toISOString(),
        outputs: {
            web: WEB_DIR,
            wordpressPlugin: WP_DIR
        }
    };

    await writeFile(join(DIST_DIR, 'build-info.json'), JSON.stringify(info, null, 2), 'utf8');
}

await rm(DIST_DIR, { recursive: true, force: true });
await mkdir(DIST_DIR, { recursive: true });

await buildWebBundle();
await buildWordPressBundle();
await writeBuildInfo();

console.log(`Build completado en ${DIST_DIR}`);
