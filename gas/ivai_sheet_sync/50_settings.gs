function setApiToken() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Configurar token API', 'Pega el token Bearer (sin "Bearer "):', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;

  const token = String(result.getResponseText() || '').trim();
  if (!token) {
    ui.alert('Token vacio. No se guardó.');
    return;
  }

  PropertiesService.getScriptProperties().setProperty('IVAI_API_TOKEN', token);
  ui.alert('Token guardado en Script Properties.');
}

function showActiveSettings() {
  try {
    const settings = getSettings_();
    const token = settings.token || '';
    const tokenMask = token.length > 8
      ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}`
      : (token ? '***' : 'NO CONFIGURADO');

    SpreadsheetApp.getUi().alert(
      'Configuración activa',
      [
        `Año: ${settings.year}`,
        `Base URL: ${settings.baseUrl}`,
        `Origen Base URL: ${settings.baseUrlSource || 'desconocido'}`,
        `API Update: ${settings.apiBaseUrl}`,
        `API Year Status: ${settings.yearStatusUrl}`,
        `API Delete Year: ${settings.deleteYearUrl}`,
        `Data URL: ${settings.dataBaseUrl}`,
        `Token: ${token ? tokenMask : 'NO CONFIGURADO'}`
      ].join('\n'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (err) {
    SpreadsheetApp.getUi().alert(`Error leyendo configuración: ${err.message}`);
  }
}

function setBaseUrl() {
  const ui = SpreadsheetApp.getUi();
  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const currentValue = String(cfgSheet.getRange('B3').getValue() || '').trim() || DEFAULTS.BASE_URL;

  const result = ui.prompt(
    'Configurar URL base',
    `Ingresa la URL general del proyecto (ej. https://dominio.com/ivai2024).\nActual: ${currentValue}`,
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  const nextUrl = String(result.getResponseText() || '').trim();
  if (!/^https?:\/\//i.test(nextUrl)) {
    ui.alert('URL inválida. Debe iniciar con http:// o https://');
    return;
  }

  const normalized = normalizeBaseUrl_(nextUrl);
  cfgSheet.getRange('B3').setValue(normalized);
  PropertiesService.getScriptProperties().setProperty('IVAI_BASE_URL', normalized);

  const apiUrl = deriveApiUpdateUrl_(normalized);
  SpreadsheetApp.getUi().alert(
    `URL base actualizada:\n${normalized}\n\nEndpoint de actualización derivado:\n${apiUrl}`
  );
}

// Backward compatible alias (old menu/function name)
function setApiBaseUrl() {
  setBaseUrl();
}

function getSettings_() {
  const props = PropertiesService.getScriptProperties();
  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());

  const yearCell = String(cfgSheet.getRange('B2').getValue() || '').trim();
  const year = yearCell || props.getProperty('IVAI_DEFAULT_YEAR') || DEFAULTS.YEAR;

  const baseData = getBaseUrlData_();
  const baseUrl = baseData.baseUrl;
  const token = props.getProperty('IVAI_API_TOKEN') || '';

  if (!/^\d{4}$/.test(String(year))) {
    throw new Error('El año (Config!B2) debe tener formato YYYY.');
  }

  if (!token) {
    throw new Error('No hay token API configurado. Usa el menu IVAI > Configurar token API.');
  }

  return {
    year: String(year),
    baseUrl,
    baseUrlSource: baseData.baseUrlSource,
    apiBaseUrl: deriveApiUpdateUrl_(baseUrl),
    yearStatusUrl: deriveYearStatusUrl_(baseUrl),
    deleteYearUrl: deriveDeleteYearUrl_(baseUrl),
    token,
    dataBaseUrl: deriveDataBaseUrl_(baseUrl)
  };
}

function getBaseUrlData_() {
  const props = PropertiesService.getScriptProperties();
  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const baseCell = String(cfgSheet.getRange('B3').getValue() || '').trim();

  const resolved = resolveBaseUrl_(baseCell, props);
  const rawBase = resolved.value;
  const baseUrl = normalizeBaseUrl_(rawBase);

  if (resolved.source.indexOf('script_properties') === 0 && baseCell !== baseUrl) {
    cfgSheet.getRange('B3').setValue(baseUrl);
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error('La URL base (Config!B3) debe iniciar con http:// o https://');
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(baseUrl)) {
    throw new Error('La URL base no puede ser localhost. Usa una URL pública accesible desde internet.');
  }

  return {
    baseUrl,
    baseUrlSource: resolved.source
  };
}

function resolveBaseUrl_(baseCellValue, props) {
  const fromProps = String(props.getProperty('IVAI_BASE_URL') || '').trim();
  const fromLegacyProp = String(props.getProperty('IVAI_API_BASE_URL') || '').trim();
  const fromCell = String(baseCellValue || '').trim();

  if (fromProps) return { value: fromProps, source: 'script_properties:IVAI_BASE_URL' };
  if (fromCell) return { value: fromCell, source: 'sheet:Config!B3' };
  if (fromLegacyProp) return { value: fromLegacyProp, source: 'script_properties:IVAI_API_BASE_URL' };

  return { value: DEFAULTS.BASE_URL, source: 'default' };
}

function normalizeBaseUrl_(input) {
  const clean = String(input || '').replace(/\?.*$/, '').trim();
  if (!clean) {
    throw new Error('base_url vacío en Config!B3.');
  }

  let base = clean.replace(/\/$/, '');
  base = base.replace(/\/api\/update\.php$/i, '');
  base = base.replace(/\/data$/i, '');
  return base;
}

function deriveApiUpdateUrl_(baseUrl) {
  const base = normalizeBaseUrl_(baseUrl);
  return `${base}/api/update.php`;
}

function deriveDataBaseUrl_(baseUrl) {
  const base = normalizeBaseUrl_(baseUrl);
  return `${base}/data`;
}

function deriveYearStatusUrl_(baseUrl) {
  const base = normalizeBaseUrl_(baseUrl);
  return `${base}/api/year-status.php`;
}

function deriveDeleteYearUrl_(baseUrl) {
  const base = normalizeBaseUrl_(baseUrl);
  return `${base}/api/delete-year.php`;
}
