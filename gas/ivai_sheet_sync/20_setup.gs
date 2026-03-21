function setupIvaiSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  upsertConfigSheet_(ss);

  migrateAhpVariablesSheet_(ss);

  upsertSheetWithHeaders_(ss, 'indice', SHEET_HEADERS.indice);
  upsertSheetWithHeaders_(ss, 'indicadores', SHEET_HEADERS.indicadores);
  upsertSheetWithHeaders_(ss, 'nutricionales', SHEET_HEADERS.nutricionales);
  upsertSheetWithHeaders_(ss, 'ahp_dimensiones', SHEET_HEADERS.ahp_dimensiones);
  upsertSheetWithHeaders_(ss, 'ahp_indicadores', SHEET_HEADERS.ahp_indicadores);
  upsertDataDictionarySheet_(ss, { overwrite: true });

  SpreadsheetApp.getUi().alert('Hojas IVAI y diccionario de datos creados/actualizados correctamente.');
}
