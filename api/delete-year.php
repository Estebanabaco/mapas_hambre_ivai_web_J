<?php
header('Content-Type: application/json');

$secretToken = null;
$localConfigPath = __DIR__ . '/config.local.php';

if (file_exists($localConfigPath)) {
    $localConfig = require $localConfigPath;
    if (is_array($localConfig) && isset($localConfig['secret_token'])) {
        $candidate = trim((string) $localConfig['secret_token']);
        if ($candidate !== '') {
            $secretToken = $candidate;
        }
    }
}

if ($secretToken === null) {
    $envToken = getenv('IVAI_SECRET_TOKEN');
    if (is_string($envToken)) {
        $envToken = trim($envToken);
        if ($envToken !== '') {
            $secretToken = $envToken;
        }
    }
}

if ($secretToken === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Server secret token is not configured.']);
    exit;
}

function read_json_locked_delete(string $path, array $default = []): array
{
    if (!file_exists($path)) {
        return $default;
    }

    $fh = fopen($path, 'rb');
    if ($fh === false) {
        return $default;
    }

    if (!flock($fh, LOCK_SH)) {
        fclose($fh);
        return $default;
    }

    $content = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);

    $decoded = json_decode($content ?: '', true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return $default;
    }

    return $decoded;
}

function write_json_locked_delete(string $path, array $data): bool
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        return false;
    }

    $fh = fopen($path, 'c+');
    if ($fh === false) {
        return false;
    }

    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        return false;
    }

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        flock($fh, LOCK_UN);
        fclose($fh);
        return false;
    }

    ftruncate($fh, 0);
    rewind($fh);
    $ok = fwrite($fh, $json) !== false;
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);

    return $ok;
}

function remove_dir_recursive(string $dirPath): array
{
    if (!is_dir($dirPath)) {
        return ['removed' => false, 'filesDeleted' => 0];
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dirPath, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    $filesDeleted = 0;
    foreach ($iterator as $item) {
        if ($item->isDir()) {
            if (!rmdir($item->getPathname())) {
                return ['removed' => false, 'filesDeleted' => $filesDeleted, 'error' => 'No se pudo eliminar subdirectorio.'];
            }
            continue;
        }

        if (!unlink($item->getPathname())) {
            return ['removed' => false, 'filesDeleted' => $filesDeleted, 'error' => 'No se pudo eliminar archivo.'];
        }
        $filesDeleted++;
    }

    if (!rmdir($dirPath)) {
        return ['removed' => false, 'filesDeleted' => $filesDeleted, 'error' => 'No se pudo eliminar el directorio del año.'];
    }

    return ['removed' => true, 'filesDeleted' => $filesDeleted];
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (strpos($authHeader, 'Bearer ') !== 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization header missing or invalid.']);
    exit;
}

$token = substr($authHeader, 7);
if (!hash_equals($secretToken, $token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Only POST is accepted.']);
    exit;
}

$year = $_GET['year'] ?? '';
if (!preg_match('/^\d{4}$/', (string) $year)) {
    http_response_code(400);
    echo json_encode(['error' => "Debe especificar un parámetro 'year' válido de 4 dígitos."]);
    exit;
}

$catalogPath = __DIR__ . '/../config/metadatos.json';
$yearStatusPath = __DIR__ . '/../config/year_status.json';
$yearDirPath = __DIR__ . '/../data/' . $year;

$dirResult = remove_dir_recursive($yearDirPath);
if (isset($dirResult['error'])) {
    http_response_code(500);
    echo json_encode(['error' => $dirResult['error']]);
    exit;
}

$catalog = read_json_locked_delete($catalogPath, []);
$catalogUpdated = false;
if (!empty($catalog)) {
    if (isset($catalog['availableYears']) && is_array($catalog['availableYears'])) {
        $filteredYears = [];
        foreach ($catalog['availableYears'] as $y) {
            if ((string) $y !== (string) $year) {
                $filteredYears[] = (int) $y;
            }
        }
        rsort($filteredYears, SORT_NUMERIC);
        $catalog['availableYears'] = array_values($filteredYears);
        $catalogUpdated = true;
    }

    if (isset($catalog['rutas']) && is_array($catalog['rutas']) && array_key_exists((string) $year, $catalog['rutas'])) {
        unset($catalog['rutas'][(string) $year]);
        $catalogUpdated = true;
    }

    if (isset($catalog['defaultYear']) && (string) $catalog['defaultYear'] === (string) $year) {
        if (!empty($catalog['availableYears'])) {
            $catalog['defaultYear'] = (int) $catalog['availableYears'][0];
        } else {
            $catalog['defaultYear'] = null;
        }
        $catalogUpdated = true;
    }

    if ($catalogUpdated && !write_json_locked_delete($catalogPath, $catalog)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo actualizar metadatos.json.']);
        exit;
    }
}

$statusMap = read_json_locked_delete($yearStatusPath, []);
$statusRemoved = false;
if (array_key_exists((string) $year, $statusMap)) {
    unset($statusMap[(string) $year]);
    if (!write_json_locked_delete($yearStatusPath, $statusMap)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo actualizar year_status.json.']);
        exit;
    }
    $statusRemoved = true;
}

echo json_encode([
    'success' => true,
    'year' => (string) $year,
    'dataDirectoryRemoved' => !empty($dirResult['removed']),
    'filesDeleted' => (int) ($dirResult['filesDeleted'] ?? 0),
    'catalogUpdated' => $catalogUpdated,
    'yearStatusRemoved' => $statusRemoved
]);
