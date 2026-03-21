function readTableAsObjects_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`No existe la hoja: ${sheetName}`);
  }

  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];

  const headers = values[0].map((h) => String(h || '').trim());
  const output = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    let hasData = false;

    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (!header) continue;

      const rawValue = row[c];
      if (rawValue === '' || rawValue === null) continue;

      obj[header] = normalizeCellValue_(rawValue);
      hasData = true;
    }

    if (hasData) output.push(obj);
  }

  return output;
}

function normalizeCellValue_(value) {
  if (typeof value === 'number') return value;
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const text = String(value).trim();
  if (text === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);

  return text;
}

function writeDeptObjectToSheet_(sheetName, objByDept) {
  const rows = [];
  Object.keys(objByDept || {})
    .sort((a, b) => Number(a) - Number(b))
    .forEach((deptCode) => {
      const row = Object.assign({ dept_code: deptCode }, objByDept[deptCode]);
      rows.push(row);
    });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`No existe hoja ${sheetName}`);
  if (!rows.length) throw new Error(`No hay filas para escribir en ${sheetName}`);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map((h) => String(h || '').trim())
    .filter(Boolean);
  if (!headers.length) throw new Error(`La hoja ${sheetName} no tiene encabezados.`);

  clearSheetData_(sheet);
  const matrix = rows.map((r) => headers.map((h) => (r[h] === undefined ? '' : r[h])));
  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

function writeArrayObjectsToSheet_(sheetName, rows, headers) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`No existe hoja ${sheetName}`);

  clearSheetData_(sheet);
  if (!rows || !rows.length) return;

  const matrix = rows.map((r) => headers.map((h) => (r[h] === undefined ? '' : r[h])));
  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

function clearSheetData_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

function backupSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName(sheetName);
  if (!source) return '';

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  let backupName = `${sheetName}_backup_${stamp}`;
  if (backupName.length > 99) backupName = backupName.substring(0, 99);

  const backup = source.copyTo(ss).setName(backupName);
  ss.setActiveSheet(source);
  ss.moveActiveSheet(source.getIndex());
  return backup.getName();
}

function upsertConfigSheet_(ss) {
  let sheet = ss.getSheetByName('Config');
  if (!sheet) {
    sheet = ss.insertSheet('Config');
  }

  const labels = [
    ['Parametro', 'Valor'],
    ['year', DEFAULTS.YEAR],
    ['api_base_url', DEFAULTS.API_BASE_URL],
    ['api_token', '(se guarda en Script Properties)']
  ];

  sheet.getRange(1, 1, labels.length, labels[0].length).setValues(labels);
  sheet.getRange('A1:B1').setFontWeight('bold');
  sheet.autoResizeColumns(1, 2);

  return sheet;
}

function upsertSheetWithHeaders_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  const currentHeader = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  const isEmptyHeader = currentHeader.every((v) => String(v || '').trim() === '');

  if (isEmptyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('A1:' + columnToLetter_(headers.length) + '1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
}

function columnToLetter_(column) {
  let temp;
  let letter = '';
  let col = column;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}
