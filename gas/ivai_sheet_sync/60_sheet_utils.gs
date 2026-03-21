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
      const rawData = objByDept[deptCode] || {};
      const normalizedData = (sheetName === 'indicadores')
        ? transformIndicadoresJsonToSheetRow_(rawData)
        : rawData;
      const row = Object.assign({ dept_code: deptCode }, normalizedData);
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

function transformIndicadoresJsonToSheetRow_(rowObj) {
  const out = {};
  Object.keys(rowObj || {}).forEach((key) => {
    const mapped = INDICADORES_JSON_TO_SHEET[key] || key;
    out[mapped] = rowObj[key];
  });
  return out;
}

function transformIndicadoresSheetToJsonRow_(rowObj) {
  const out = {};
  Object.keys(rowObj || {}).forEach((key) => {
    const mapped = INDICADORES_SHEET_TO_JSON[key] || key;
    out[mapped] = rowObj[key];
  });
  return out;
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

  // Escribir estructura base solo cuando esté vacía para no pisar configuración del usuario.
  const a1 = String(sheet.getRange('A1').getValue() || '').trim();
  const b2 = String(sheet.getRange('B2').getValue() || '').trim();
  const b3 = String(sheet.getRange('B3').getValue() || '').trim();
  const b4 = String(sheet.getRange('B4').getValue() || '').trim();

  if (a1 === '') sheet.getRange('A1').setValue('Parametro');
  if (String(sheet.getRange('B1').getValue() || '').trim() === '') sheet.getRange('B1').setValue('Valor');

  if (String(sheet.getRange('A2').getValue() || '').trim() === '') sheet.getRange('A2').setValue('year');
  if (String(sheet.getRange('A3').getValue() || '').trim() === '') sheet.getRange('A3').setValue('base_url');
  if (String(sheet.getRange('A4').getValue() || '').trim() === '') sheet.getRange('A4').setValue('api_token');

  if (b2 === '') sheet.getRange('B2').setValue(DEFAULTS.YEAR);
  if (b3 === '') sheet.getRange('B3').setValue(DEFAULTS.BASE_URL);
  if (b4 === '') sheet.getRange('B4').setValue('(se guarda en Script Properties)');

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

function resolveAhpIndicadoresSheetName_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('ahp_indicadores')) return 'ahp_indicadores';
  if (ss.getSheetByName('ahp_variables_intra')) return 'ahp_variables_intra';
  return 'ahp_indicadores';
}

function migrateAhpVariablesSheet_(ss) {
  const newSheet = ss.getSheetByName('ahp_indicadores');
  const legacySheet = ss.getSheetByName('ahp_variables_intra');

  if (!newSheet && legacySheet) {
    legacySheet.setName('ahp_indicadores');
  }
}

function upsertDataDictionarySheet_(ss, options) {
  const opts = options || {};
  let sheet = ss.getSheetByName(DATA_DICTIONARY_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DATA_DICTIONARY_SHEET);
  }

  const shouldOverwrite = !!opts.overwrite;
  const hasData = sheet.getLastRow() > 1;

  sheet.getRange(1, 1, 1, DATA_DICTIONARY_HEADERS.length).setValues([DATA_DICTIONARY_HEADERS]);
  sheet.getRange(1, 1, 1, DATA_DICTIONARY_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (shouldOverwrite || !hasData) {
    clearSheetData_(sheet);
    const rows = getDataDictionaryRows_();
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, DATA_DICTIONARY_HEADERS.length).setValues(rows);
    }
  }

  sheet.autoResizeColumns(1, DATA_DICTIONARY_HEADERS.length);
  return sheet;
}

function getDataDictionaryRows_() {
  const dictionaryMeta = getDictionaryMetadata_();
  const rows = [];

  function pushRow(group, sheetName, variableSheet, variableJson, displayName, meta) {
    const details = meta || {};
    rows.push([
      group,
      sheetName,
      variableSheet,
      variableJson,
      details.nombre_mostrado || displayName,
      details.descripcion || '',
      details.unidad || ''
    ]);
  }

  SHEET_HEADERS.indice
    .filter((v) => v !== 'dept_code')
    .forEach((v) => {
      const meta = resolveIndiceMeta_(v, dictionaryMeta.appConfig || {});
      pushRow('indice', 'indice', v, v, v, meta);
    });

  SHEET_HEADERS.indicadores
    .filter((v) => v !== 'dept_code')
    .forEach((v) => {
      const jsonName = INDICADORES_SHEET_TO_JSON[v] || v;
      const meta = resolveIndicadorMeta_(v, jsonName, dictionaryMeta.indicadoresByJsonName || {});
      pushRow('indicadores', 'indicadores', v, jsonName, jsonName, meta);
    });

  SHEET_HEADERS.nutricionales
    .filter((v) => v !== 'dept_code')
    .forEach((v) => {
      const meta = resolveNutricionalMeta_(v, dictionaryMeta.appConfig || {});
      pushRow('nutricionales', 'nutricionales', v, v, v, meta);
    });

  SHEET_HEADERS.ahp_dimensiones.forEach((v) => pushRow('ahp', 'ahp_dimensiones', v, v, v));
  SHEET_HEADERS.ahp_indicadores.forEach((v) => pushRow('ahp', 'ahp_indicadores', v, v, v));

  return rows;
}

function getDictionaryMetadata_() {
  let baseUrl;
  try {
    baseUrl = getBaseUrlData_().baseUrl;
  } catch (error) {
    return {
      indicadoresByJsonName: {},
      appConfig: {}
    };
  }

  const indicadoresByJsonName = fetchJsonSafe_(`${baseUrl}/config/config_indicadores.json`) || {};
  const appConfig = fetchJsonSafe_(`${baseUrl}/config/configuracion_app.json`) || {};

  return {
    indicadoresByJsonName,
    appConfig
  };
}

function fetchJsonSafe_(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });

    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
      return null;
    }

    return JSON.parse(response.getContentText());
  } catch (error) {
    return null;
  }
}

function resolveIndicadorMeta_(variableSheet, variableJson, indicadoresByJsonName) {
  const byJsonName = indicadoresByJsonName[variableJson];
  if (!byJsonName) {
    return {
      nombre_mostrado: variableJson
    };
  }

  return {
    nombre_mostrado: byJsonName.nombre_completo || variableJson,
    descripcion: byJsonName.descripcion || '',
    unidad: byJsonName.unidad_medida || ''
  };
}

function resolveIndiceMeta_(variable, appConfig) {
  const key = variable === 'Indice' ? 'integrated' : variable;
  const config = appConfig[key] || {};

  return {
    nombre_mostrado: config.nombre || variable,
    descripcion: config.descripcion || '',
    unidad: ''
  };
}

function resolveNutricionalMeta_(variable, appConfig) {
  const config = appConfig[variable] || {};
  return {
    nombre_mostrado: config.nombre || variable,
    descripcion: config.descripcion || '',
    unidad: ''
  };
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
