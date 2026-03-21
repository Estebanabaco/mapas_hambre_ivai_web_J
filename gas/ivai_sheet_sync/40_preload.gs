function preloadBaseYear() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettings_();
  const year = settings.year;

  const backups = [];
  backups.push(backupSheet_('indice'));
  backups.push(backupSheet_('indicadores'));
  backups.push(backupSheet_('nutricionales'));
  backups.push(backupSheet_(DATA_DICTIONARY_SHEET));

  const indice = fetchYearJson_(year, 'indice');
  const indicadores = fetchYearJson_(year, 'indicadores');
  const nutricionales = fetchYearJson_(year, 'nutricionales');

  writeDeptObjectToSheet_('indice', indice);
  writeDeptObjectToSheet_('indicadores', indicadores);
  writeDeptObjectToSheet_('nutricionales', nutricionales);
  upsertDataDictionarySheet_(ss, { overwrite: true });

  SpreadsheetApp.getUi().alert(
    `Precarga base + diccionario completada para ${year}.\nRespaldos: ${backups.filter(Boolean).join(', ') || 'sin respaldo'}`
  );
}

function preloadAhpYear() {
  const settings = getSettings_();
  const year = settings.year;

  const backupDim = backupSheet_('ahp_dimensiones');
  const ahpIndicadoresSheet = resolveAhpIndicadoresSheetName_();
  const backupVar = backupSheet_(ahpIndicadoresSheet);

  const ahp = fetchYearJson_(year, 'ahp');
  if (!ahp || !ahp.Pesos_Dimensiones || !ahp.Pesos_Variables_Intra) {
    throw new Error('El JSON AHP no tiene la estructura esperada.');
  }

  writeArrayObjectsToSheet_('ahp_dimensiones', ahp.Pesos_Dimensiones, SHEET_HEADERS.ahp_dimensiones);
  writeArrayObjectsToSheet_('ahp_indicadores', ahp.Pesos_Variables_Intra, SHEET_HEADERS.ahp_indicadores);

  SpreadsheetApp.getUi().alert(
    `Precarga AHP completada para ${year}.\nRespaldos: ${[backupDim, backupVar].filter(Boolean).join(', ') || 'sin respaldo'}`
  );
}

function fetchYearJson_(year, type) {
  const settings = getSettings_();
  const fileName = DATA_FILES[type];
  if (!fileName) {
    throw new Error(`Tipo no soportado para precarga: ${type}`);
  }

  const url = `${settings.dataBaseUrl}/${encodeURIComponent(year)}/${fileName}`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error(`No se pudo leer ${type} para año ${year}. HTTP ${code}. URL: ${url}`);
  }

  try {
    return JSON.parse(body);
  } catch (err) {
    throw new Error(`JSON inválido en ${url}`);
  }
}
