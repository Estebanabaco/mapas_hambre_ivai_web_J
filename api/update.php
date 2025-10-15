<?php
header('Content-Type: application/json');

// --- Configuración ---
define('SECRET_TOKEN', 'AbacoIvai2030');

// Mapeo de claves de API a las rutas de archivo de destino
$allowedFiles = [
    'site_config' => '../config/site_config.json',
    'configuracion_app' => '../data_example/configuracion_app.json',
    'pesos_ahp' => '../data_example/002_Pesos_AHP_Hambre.json',
    'datos_indice' => '../data_example/datos_indice.json',
    'datos_nutricionales' => '../data_example/datos_nutricionales.json',
    'pesos_ahp_2023' => '../data/2023/002_Pesos_AHP_Hambre.json',
    'datos_indice_2023' => '../data/2023/datos_indice.json',
    'datos_nutricionales_2023' => '../data/2023/datos_nutricionales.json'
];

// Mapeo a los archivos de plantilla para validación de estructura
$validationTemplates = [
    'site_config' => '../config/site_config.example.json',
    'configuracion_app' => '../data_example/configuracion_app.json',
    'pesos_ahp' => '../data_example/002_Pesos_AHP_Hambre.json',
    'datos_indice' => '../data_example/datos_indice.json',
    'datos_nutricionales' => '../data_example/datos_nutricionales.json',
    'pesos_ahp_2023' => '../data_example/2023/002_Pesos_AHP_Hambre.json',
    'datos_indice_2023' => '../data_example/2023/datos_indice.json',
    'datos_nutricionales_2023' => '../data_example/2023/datos_nutricionales.json'
];

/**
 * Valida recursivamente que las claves de un array de datos coincidan con las de una plantilla.
 *
 * @param array $data El array de datos a validar.
 * @param array $template El array de plantilla con la estructura esperada.
 * @return bool True si las claves coinciden, False en caso contrario.
 */
function validate_keys(array $data, array $template): bool
{
    $dataKeys = array_keys($data);
    $templateKeys = array_keys($template);
    sort($dataKeys);
    sort($templateKeys);

    if ($dataKeys !== $templateKeys) {
        return false;
    }

    foreach ($template as $key => $value) {
        if (is_array($value) && isset($data[$key]) && is_array($data[$key])) {
            // Si el valor es un array asociativo (objeto JSON), validar recursivamente.
            if (array_keys($value) !== range(0, count($value) - 1)) {
                if (!validate_keys($data[$key], $value)) {
                    return false;
                }
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
if (!hash_equals(SECRET_TOKEN, $token)) {
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

$fileKey = $_GET['file'] ?? '';
if (!array_key_exists($fileKey, $allowedFiles)) {
    http_response_code(400);
    echo json_encode(['error' => "Invalid file key specified. Allowed keys: " . implode(', ', array_keys($allowedFiles))]);
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
$templatePath = $validationTemplates[$fileKey];
if (!file_exists($templatePath)) {
    http_response_code(500);
    echo json_encode(['error' => "Validation template file not found: {$templatePath}"]);
    exit;
}

$templateData = json_decode(file_get_contents($templatePath), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => "Could not parse validation template JSON: {$templatePath}"]);
    exit;
}

if (!validate_keys($inputData, $templateData)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON structure does not match the expected template.']);
    exit;
}

// --- 5. Escritura del Archivo ---
$filePath = $allowedFiles[$fileKey];
if (file_put_contents($filePath, json_encode($inputData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    http_response_code(200);
    echo json_encode(['success' => "File '{$fileKey}' updated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(['error' => "Failed to write to file: {$filePath}"]);
}
?>