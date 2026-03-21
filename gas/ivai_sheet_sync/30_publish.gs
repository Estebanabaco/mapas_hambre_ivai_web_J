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
  publishByTypes_(['indice', 'indicadores', 'nutricionales', 'ahp'], 'Resultado publicación (incluye AHP)');
}

function publishBaseOnly() {
  publishByTypes_(['indice', 'indicadores', 'nutricionales'], 'Resultado publicación (datos base)');
}

function publishByTypes_(types, title) {
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

  const readinessNote = maybeBuildBaseReadinessNote_(types);
  const message = `${title}:\n${results.join('\n')}${readinessNote ? `\n\n${readinessNote}` : ''}`;
  SpreadsheetApp.getUi().alert(message);
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
    const variables = readTableAsObjects_(resolveAhpIndicadoresSheetName_());

    if (!dimensiones.length || !variables.length) {
      throw new Error('Las hojas AHP no tienen datos suficientes.');
    }

    return {
      Pesos_Dimensiones: dimensiones,
      Pesos_Variables_Intra: variables
    };
  }

  const sheetName = IVAI_TYPES[type].sheet;
  const rows = readTableAsObjects_(sheetName, {
    includeEmptyColumns: true,
    headers: SHEET_HEADERS[sheetName]
  });
  if (!rows.length) {
    throw new Error(`La hoja ${sheetName} no tiene datos.`);
  }

  const output = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const deptCode = row.dept_code;
    if (deptCode === null || deptCode === undefined || String(deptCode).trim() === '') {
      continue;
    }

    delete row.dept_code;
    const normalizedRow = (type === 'indicadores')
      ? transformIndicadoresSheetToJsonRow_(row)
      : row;

    output[String(deptCode)] = normalizedRow;
  }

  if (!Object.keys(output).length) {
    throw new Error(`No se encontraron dept_code validos en hoja ${sheetName}.`);
  }

  return output;
}

function maybeBuildBaseReadinessNote_(types) {
  if (!isBaseTypesSelection_(types)) {
    return '';
  }

  try {
    const statusResponse = fetchYearStatus_();
    const status = (statusResponse && statusResponse.status) || {};
    const baseReady = !!status.baseReady;
    const visible = !!statusResponse.visibleInCatalog;

    if (baseReady && visible) {
      return `Estado del año ${statusResponse.year}: LISTO. Ya está visible en la app.`;
    }

    if (baseReady && !visible) {
      return `Estado del año ${statusResponse.year}: base completa, pero aún no visible en catálogo.`;
    }

    return `Estado del año ${statusResponse.year}: base incompleta (indice=${boolToSiNo_(status.indice)}, indicadores=${boolToSiNo_(status.indicadores)}, nutricionales=${boolToSiNo_(status.nutricionales)}).`;
  } catch (err) {
    return `No se pudo consultar estado de activación del año: ${err.message}`;
  }
}

function isBaseTypesSelection_(types) {
  if (!types || types.length !== 3) {
    return false;
  }

  const expected = { indice: true, indicadores: true, nutricionales: true };
  for (let i = 0; i < types.length; i++) {
    if (!expected[types[i]]) {
      return false;
    }
  }

  return true;
}

function fetchYearStatus_() {
  const settings = getSettings_();
  const url = `${settings.yearStatusUrl}?year=${encodeURIComponent(settings.year)}`;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
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

  const parsed = JSON.parse(body || '{}');
  if (!parsed || parsed.success !== true) {
    throw new Error('Respuesta inválida de year-status.');
  }

  return parsed;
}

function boolToSiNo_(value) {
  return value ? 'si' : 'no';
}
