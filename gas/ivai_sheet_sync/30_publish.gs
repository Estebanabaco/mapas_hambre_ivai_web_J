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

  SpreadsheetApp.getUi().alert(`${title}:\n` + results.join('\n'));
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
    const normalizedRow = (type === 'indicadores')
      ? transformIndicadoresSheetToJsonRow_(row)
      : row;

    output[String(deptCode)] = normalizedRow;
  }

  if (!Object.keys(output).length) {
    throw new Error(`No se encontraron dept_code validos en hoja ${IVAI_TYPES[type].sheet}.`);
  }

  return output;
}
