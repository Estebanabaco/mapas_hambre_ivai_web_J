const IVAI_TYPES = {
  indice: { sheet: 'indice', mode: 'dept' },
  indicadores: { sheet: 'indicadores', mode: 'dept' },
  nutricionales: { sheet: 'nutricionales', mode: 'dept' },
  ahp: { sheet: 'ahp_dimensiones', mode: 'ahp' }
};

const DEFAULTS = {
  API_BASE_URL: 'http://localhost/ivai2024/api/update.php',
  YEAR: '2024'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IVAI')
    .addItem('1) Preparar hojas base', 'setupIvaiSheets')
    .addSeparator()
    .addItem('Publicar indice', 'publishIndice')
    .addItem('Publicar indicadores', 'publishIndicadores')
    .addItem('Publicar nutricionales', 'publishNutricionales')
    .addItem('Publicar AHP', 'publishAhp')
    .addItem('Publicar TODO', 'publishAll')
    .addSeparator()
    .addItem('Configurar token API', 'setApiToken')
    .addItem('Usar localhost por defecto', 'setLocalhostApi')
    .addToUi();
}

function setupIvaiSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  upsertConfigSheet_(ss);

  upsertSheetWithHeaders_(ss, 'indice', [
    'dept_code',
    'Indice',
    'Ranking',
    'Clasificacion_Indice',
    'Pobreza',
    'Desempleo_Ingresos',
    'Salud_Nutricion',
    'Inseguridad_Alimentaria',
    'Factores_Demograficos',
    'Acceso_Servicios',
    'Acceso_Grupos_Alimentos'
  ]);

  upsertSheetWithHeaders_(ss, 'indicadores', [
    'dept_code',
    'gini',
    'desmp',
    'ipc_alim',
    'prnbi',
    'ctrl_pren',
    'mrt_mtna',
    'morb_desn_agd_u5',
    'morb_eda_u5',
    'mrt_desn_agd_u5',
    'mrt_eda_u5',
    'desn_cron_u5',
    'bpn',
    'is_mod_grv',
    'is_grv',
    'hgr_12m',
    'prom_hgr',
    'tf_10_14',
    'tf_15_19',
    'etnica',
    'hog_acued',
    'hog_alcant',
    'hog_aseo',
    'hog_energia',
    'hog_carnes',
    'hog_huevos',
    'hog_lact',
    'hog_frutas',
    'hog_verd',
    'hog_cer',
    'hog_granos',
    'hog_tuberc',
    'pob_monet',
    'pob_ext',
    'pob_subjetiva',
    'pob_multi'
  ]);

  upsertSheetWithHeaders_(ss, 'nutricionales', [
    'dept_code',
    'ENSIN',
    'Cronica',
    'R_Cronica',
    'Aguda',
    'R_Aguda'
  ]);

  upsertSheetWithHeaders_(ss, 'ahp_dimensiones', [
    'Dimension',
    'Peso_Dimension'
  ]);

  upsertSheetWithHeaders_(ss, 'ahp_variables_intra', [
    'Dimension',
    'Variable',
    'Peso_Variable',
    'CR'
  ]);

  SpreadsheetApp.getUi().alert('Hojas IVAI creadas/actualizadas correctamente.');
}

function publishIndice() {
  publishType_('indice');
}

function publishIndicadores() {
  publishType_('indicadores');
}

function publishNutricionales() {
  publishType_('nutricionales');
}

function publishAhp() {
  publishType_('ahp');
}

function publishAll() {
  const types = ['indice', 'indicadores', 'nutricionales', 'ahp'];
  const results = [];

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    try {
      const response = publishType_(type, true);
      results.push(`${type}: OK (${response.getResponseCode()})`);
    } catch (err) {
      results.push(`${type}: ERROR (${err.message})`);
    }
  }

  SpreadsheetApp.getUi().alert('Resultado publicación:\n' + results.join('\n'));
}

function publishType_(type, silent) {
  const settings = getSettings_();
  const payloadObj = buildPayloadByType_(type);
  const endpoint = `${settings.apiBaseUrl}?type=${encodeURIComponent(type)}&year=${encodeURIComponent(settings.year)}`;

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payloadObj),
    headers: {
      Authorization: `Bearer ${settings.token}`
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error(`HTTP ${code}: ${body}`);
  }

  if (!silent) {
    SpreadsheetApp.getUi().alert(`Publicación ${type} exitosa.\nHTTP ${code}\n${body}`);
  }

  return response;
}

function buildPayloadByType_(type) {
  if (!IVAI_TYPES[type]) {
    throw new Error(`Tipo no soportado: ${type}`);
  }

  if (type === 'ahp') {
    const dimensiones = readTableAsObjects_('ahp_dimensiones');
    const variables = readTableAsObjects_('ahp_variables_intra');

    if (!dimensiones.length || !variables.length) {
      throw new Error('Las hojas AHP no tienen datos suficientes.');
    }

    return {
      Pesos_Dimensiones: dimensiones,
      Pesos_Variables_Intra: variables
    };
  }

  const rows = readTableAsObjects_(IVAI_TYPES[type].sheet);
  if (!rows.length) {
    throw new Error(`La hoja ${IVAI_TYPES[type].sheet} no tiene datos.`);
  }

  const output = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const deptCode = row.dept_code;
    if (deptCode === null || deptCode === undefined || String(deptCode).trim() === '') {
      continue;
    }

    delete row.dept_code;
    output[String(deptCode)] = row;
  }

  if (!Object.keys(output).length) {
    throw new Error(`No se encontraron dept_code validos en hoja ${IVAI_TYPES[type].sheet}.`);
  }

  return output;
}

function readTableAsObjects_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`No existe la hoja: ${sheetName}`);
  }

  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h || '').trim());
  const output = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    let hasData = false;

    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (!header) continue;

      const rawValue = row[c];
      if (rawValue === '' || rawValue === null) {
        continue;
      }

      obj[header] = normalizeCellValue_(rawValue);
      hasData = true;
    }

    if (hasData) {
      output.push(obj);
    }
  }

  return output;
}

function normalizeCellValue_(value) {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const text = String(value).trim();
  if (text === '') return '';

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text);
  }

  return text;
}

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
  const props = PropertiesService.getScriptProperties();
  props.setProperty('IVAI_API_BASE_URL', DEFAULTS.API_BASE_URL);

  const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());
  cfgSheet.getRange('B3').setValue(DEFAULTS.API_BASE_URL);

  SpreadsheetApp.getUi().alert('API configurada a localhost por defecto.');
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

  if (!token) {
    throw new Error('No hay token API configurado. Usa el menu IVAI > Configurar token API.');
  }

  return {
    year: String(year),
    apiBaseUrl,
    token
  };
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
  const isEmptyHeader = currentHeader.every(v => String(v || '').trim() === '');

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
