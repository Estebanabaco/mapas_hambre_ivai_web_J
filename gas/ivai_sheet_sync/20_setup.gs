function setupIvaiSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  upsertConfigSheet_(ss);

  upsertSheetWithHeaders_(ss, 'indice', SHEET_HEADERS.indice);
  upsertSheetWithHeaders_(ss, 'indicadores', SHEET_HEADERS.indicadores);
  upsertSheetWithHeaders_(ss, 'nutricionales', SHEET_HEADERS.nutricionales);
  upsertSheetWithHeaders_(ss, 'ahp_dimensiones', SHEET_HEADERS.ahp_dimensiones);
  upsertSheetWithHeaders_(ss, 'ahp_variables_intra', SHEET_HEADERS.ahp_variables_intra);

  SpreadsheetApp.getUi().alert('Hojas IVAI creadas/actualizadas correctamente.');
}
