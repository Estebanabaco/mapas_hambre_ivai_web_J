import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['js', 'src'];
const excludeDirs = new Set(['node_modules', '.git', 'data']);

async function collectJsFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!excludeDirs.has(entry.name)) {
                files.push(...await collectJsFiles(fullPath));
            }
            continue;
        }

        if (extname(entry.name) === '.js' || extname(entry.name) === '.mjs') {
            files.push(fullPath);
        }
    }

    return files;
}

const allFiles = [];
for (const root of roots) {
    allFiles.push(...await collectJsFiles(root));
}

let hasErrors = false;
for (const file of allFiles) {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) {
        hasErrors = true;
    }
}

if (hasErrors) {
    process.exit(1);
}

console.log(`OK: ${allFiles.length} archivos JS verificados.`);
