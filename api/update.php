<?php
header('Content-Type: application/json');

// --- Configuración de seguridad ---
// Prioridad del token:
// 1) api/config.local.php -> ['secret_token' => '...']
// 2) variable de entorno IVAI_SECRET_TOKEN
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

// Mapeo de tipos de datos permitidos a sus nombres de archivo
$allowedTypes = [
    'indice' => 'datos_indice.json',
    'indicadores' => 'datos_indicadores.json',
    'nutricionales' => 'datos_nutricionales.json',
    'ahp' => '002_Pesos_AHP_Hambre.json'
];

$catalogPath = __DIR__ . '/../config/metadatos.json';
$yearStatusPath = __DIR__ . '/../config/year_status.json';

/**
 * Lee JSON desde disco con lock compartido. Si no existe, retorna $default.
 */
function read_json_locked(string $path, array $default = []): array
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

/**
 * Escribe JSON en disco con lock exclusivo.
 */
function write_json_locked(string $path, array $data): bool
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

/**
 * Rutas estandar por año para metadatos.
 */
function standard_routes_for_year(string $year): array
{
    return [
        'indexData' => "data/{$year}/datos_indice.json",
        'nutritionData' => "data/{$year}/datos_nutricionales.json",
        'indicatorData' => "data/{$year}/datos_indicadores.json",
        'weights' => "data/{$year}/002_Pesos_AHP_Hambre.json"
    ];
}

/**
 * Actualiza estado de completitud por año.
 */
function update_year_status(string $statusPath, string $year, string $type): array
{
    $status = read_json_locked($statusPath, []);
    if (!isset($status[$year]) || !is_array($status[$year])) {
        $status[$year] = [
            'indice' => false,
            'indicadores' => false,
            'nutricionales' => false,
            'ahp' => false,
            'baseReady' => false,
            'updatedAt' => null
        ];
    }

    $status[$year][$type] = true;
    $status[$year]['baseReady'] =
        !empty($status[$year]['indice']) &&
        !empty($status[$year]['indicadores']) &&
        !empty($status[$year]['nutricionales']);
    $status[$year]['updatedAt'] = date('c');

    if (!write_json_locked($statusPath, $status)) {
        return [
            'ok' => false,
            'error' => 'No se pudo actualizar year_status.json.'
        ];
    }

    return [
        'ok' => true,
        'status' => $status[$year]
    ];
}

/**
 * Sincroniza metadatos solo si baseReady=true.
 */
function sync_catalog_when_base_ready(string $catalogPath, string $year, bool $baseReady): array
{
    if (!$baseReady) {
        return ['ok' => true, 'catalogUpdated' => false];
    }

    $catalog = read_json_locked($catalogPath, []);
    if (empty($catalog) || !isset($catalog['availableYears']) || !isset($catalog['rutas'])) {
        return [
            'ok' => false,
            'error' => 'metadatos.json no tiene la estructura esperada.'
        ];
    }

    $yearInt = (int) $year;
    $available = array_map('intval', (array) $catalog['availableYears']);
    if (!in_array($yearInt, $available, true)) {
        $available[] = $yearInt;
    }
    rsort($available, SORT_NUMERIC);
    $catalog['availableYears'] = array_values($available);
    if (!empty($catalog['availableYears'])) {
        $catalog['defaultYear'] = (int) $catalog['availableYears'][0];
    }

    if (!isset($catalog['rutas']) || !is_array($catalog['rutas'])) {
        $catalog['rutas'] = [];
    }
    $catalog['rutas'][(string) $year] = standard_routes_for_year($year);

    if (!write_json_locked($catalogPath, $catalog)) {
        return [
            'ok' => false,
            'error' => 'No se pudo escribir metadatos.json.'
        ];
    }

    return ['ok' => true, 'catalogUpdated' => true];
}

/**
 * Valida recursivamente que las claves de un array de datos coincidan con las de una plantilla.
 */
function validate_keys(array $data, array $template): bool
{
    // Si las claves del array son numéricas (arrays convencionales), omitimos la validación estricta de orden
    // y tamaño estricto para permitir listas de diferente longitud, pero aseguramos la estructura del contenido.
    // Para simplificar, si es un array secuencial, solo validamos el primer elemento si existe.
    if (array_keys($template) === range(0, count($template) - 1)) {
       return true; 
    }

    $dataKeys = array_keys($data);
    $templateKeys = array_keys($template);
    sort($dataKeys);
    sort($templateKeys);

    if ($dataKeys !== $templateKeys) {
        return false;
    }

    foreach ($template as $key => $value) {
        // validate nested objects
        if (is_array($value) && isset($data[$key]) && is_array($data[$key])) {
             if (!validate_keys($data[$key], $value)) {
                 return false;
             }
        }
    }

    return true;
}

// --- 1. Verificación de Seguridad ---
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

// --- 2. Verificación de Método y Parámetros ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Only POST is accepted.']);
    exit;
}

$type = $_GET['type'] ?? '';
$year = $_GET['year'] ?? '';

if (!array_key_exists($type, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => "Tipo de archivo no válido. Tipos permitidos: " . implode(', ', array_keys($allowedTypes))]);
    exit;
}

if (!preg_match('/^\d{4}$/', $year)) {
    http_response_code(400);
    echo json_encode(['error' => "Debe especificar un parámetro 'year' válido de 4 dígitos (ej. ?year=2024&type=indice)."]);
    exit;
}

// --- 3. Lectura y Validación del JSON de entrada ---
$jsonInput = file_get_contents('php://input');
$inputData = json_decode($jsonInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON provided. ' . json_last_error_msg()]);
    exit;
}

// --- 4. Validación de Estructura ---
// Usamos los archivos del 2024 como plantilla dorada para verificar que las llaves sean correctas.
$templatePath = "../data/2024/{$allowedTypes[$type]}";

if (file_exists($templatePath)) {
    $templateData = json_decode(file_get_contents($templatePath), true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($templateData)) {
        if (!validate_keys($inputData, $templateData)) {
            http_response_code(400);
            echo json_encode(['error' => 'La estructura del JSON (claves y departamentos) no coincide con la plantilla estricta de la aplicación.']);
            exit;
        }
    }
}

// --- 5. Creación de Carpetas y Escritura del Archivo ---
$folderPath = "../data/{$year}";
$filePath = "{$folderPath}/{$allowedTypes[$type]}";

// Crear la carpeta del año si no existe (ej. nueva carga para 2025)
if (!is_dir($folderPath)) {
    if (!mkdir($folderPath, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => "No se pudo crear el directorio para el año {$year}."]);
        exit;
    }
}

// Escribir el nuevo archivo JSON
if (file_put_contents($filePath, json_encode($inputData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    $statusUpdate = update_year_status($yearStatusPath, $year, $type);
    if (!$statusUpdate['ok']) {
        http_response_code(500);
        echo json_encode(['error' => $statusUpdate['error']]);
        exit;
    }

    $baseReady = !empty($statusUpdate['status']['baseReady']);
    $catalogSync = sync_catalog_when_base_ready($catalogPath, $year, $baseReady);
    if (!$catalogSync['ok']) {
        http_response_code(500);
        echo json_encode(['error' => $catalogSync['error']]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => "Archivo '{$allowedTypes[$type]}' para el año {$year} actualizado con éxito.",
        'path' => $filePath,
        'yearStatus' => $statusUpdate['status'],
        'catalogUpdated' => !empty($catalogSync['catalogUpdated'])
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => "Fallo al intentar escribir el archivo en: {$filePath}"]);
}
?>
