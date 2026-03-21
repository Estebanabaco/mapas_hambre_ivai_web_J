<?php
header('Content-Type: application/json');

$year = $_GET['year'] ?? '';
if (!preg_match('/^\d{4}$/', (string) $year)) {
    http_response_code(400);
    echo json_encode(['error' => "Debe especificar un parámetro 'year' válido de 4 dígitos."]);
    exit;
}

$statusPath = __DIR__ . '/../config/year_status.json';
$catalogPath = __DIR__ . '/../config/metadatos.json';

function read_json_file_safe(string $path, array $default = []): array
{
    if (!file_exists($path)) {
        return $default;
    }

    $raw = file_get_contents($path);
    if ($raw === false) {
        return $default;
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return $default;
    }

    return $decoded;
}

$statusMap = read_json_file_safe($statusPath, []);
$status = isset($statusMap[$year]) && is_array($statusMap[$year]) ? $statusMap[$year] : [];

$normalized = [
    'indice' => !empty($status['indice']),
    'indicadores' => !empty($status['indicadores']),
    'nutricionales' => !empty($status['nutricionales']),
    'ahp' => !empty($status['ahp']),
    'baseReady' => false,
    'updatedAt' => $status['updatedAt'] ?? null
];

$normalized['baseReady'] =
    $normalized['indice'] &&
    $normalized['indicadores'] &&
    $normalized['nutricionales'];

$catalog = read_json_file_safe($catalogPath, []);
$availableYears = [];
if (isset($catalog['availableYears']) && is_array($catalog['availableYears'])) {
    $availableYears = array_map('strval', $catalog['availableYears']);
}

$visibleInCatalog = in_array((string) $year, $availableYears, true);

echo json_encode([
    'success' => true,
    'year' => (string) $year,
    'status' => $normalized,
    'visibleInCatalog' => $visibleInCatalog
]);
