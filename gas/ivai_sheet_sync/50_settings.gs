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

function setLocalhostApi() {
  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());
  cfgSheet.getRange('B3').setValue(DEFAULTS.API_BASE_URL);
  PropertiesService.getScriptProperties().setProperty('IVAI_API_BASE_URL', DEFAULTS.API_BASE_URL);

  SpreadsheetApp.getUi().alert(`API configurada a localhost:\n${DEFAULTS.API_BASE_URL}`);
}

function setApiBaseUrl() {
  const ui = SpreadsheetApp.getUi();
  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const currentValue = String(cfgSheet.getRange('B3').getValue() || '').trim() || DEFAULTS.API_BASE_URL;

  const result = ui.prompt(
    'Configurar URL API',
    `Ingresa la URL base de update.php.\nActual: ${currentValue}`,
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  const nextUrl = String(result.getResponseText() || '').trim();
  if (!/^https?:\/\//i.test(nextUrl)) {
    ui.alert('URL inválida. Debe iniciar con http:// o https://');
    return;
  }

  cfgSheet.getRange('B3').setValue(nextUrl);
  PropertiesService.getScriptProperties().setProperty('IVAI_API_BASE_URL', nextUrl);
  ui.alert(`URL API actualizada:\n${nextUrl}`);
}

function getSettings_() {
  const props = PropertiesService.getScriptProperties();
  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());

  const yearCell = String(cfgSheet.getRange('B2').getValue() || '').trim();
  const apiCell = String(cfgSheet.getRange('B3').getValue() || '').trim();

  const year = yearCell || props.getProperty('IVAI_DEFAULT_YEAR') || DEFAULTS.YEAR;
  const apiBaseUrl = apiCell || props.getProperty('IVAI_API_BASE_URL') || DEFAULTS.API_BASE_URL;
  const token = props.getProperty('IVAI_API_TOKEN') || '';

  if (!/^\d{4}$/.test(String(year))) {
    throw new Error('El año (Config!B2) debe tener formato YYYY.');
  }

  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    throw new Error('La URL API (Config!B3) debe iniciar con http:// o https://');
  }

  if (!token) {
    throw new Error('No hay token API configurado. Usa el menu IVAI > Configurar token API.');
  }

  return {
    year: String(year),
    apiBaseUrl,
    token,
    dataBaseUrl: deriveDataBaseUrl_(apiBaseUrl)
  };
}

function deriveDataBaseUrl_(apiBaseUrl) {
  const clean = String(apiBaseUrl || '').replace(/\?.*$/, '').trim();
  if (!clean) {
    throw new Error('api_base_url vacío en Config!B3.');
  }

  if (/\/api\/update\.php$/i.test(clean)) {
    return clean.replace(/\/api\/update\.php$/i, '/data');
  }

  if (/\/data$/i.test(clean)) {
    return clean;
  }

  return clean.replace(/\/$/, '') + '/data';
}
