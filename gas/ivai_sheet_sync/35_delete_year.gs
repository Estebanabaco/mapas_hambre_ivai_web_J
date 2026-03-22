function deleteYearPublished() {
  const ui = SpreadsheetApp.getUi();

  try {
    const settings = getSettings_();
    const year = String(settings.year);

    const confirm = ui.alert(
      'Borrar año publicado',
      `Se eliminarán los archivos del año ${year} en el servidor y cualquier referencia en metadatos/year_status.\n\nEsta acción no se puede deshacer.`,
      ui.ButtonSet.OK_CANCEL
    );
    if (confirm !== ui.Button.OK) {
      return;
    }

    const secondConfirm = ui.alert(
      'Confirmación final',
      `¿Confirmas borrar definitivamente el año ${year}?`,
      ui.ButtonSet.YES_NO
    );
    if (secondConfirm !== ui.Button.YES) {
      return;
    }

    const endpoint = `${settings.deleteYearUrl}?year=${encodeURIComponent(year)}`;
    const response = UrlFetchApp.fetch(endpoint, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${settings.token}`
      },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    const body = response.getContentText();
    if (code < 200 || code >= 300) {
      throw new Error(`No se pudo borrar el año. HTTP ${code}: ${body}`);
    }

    let parsed = {};
    try {
      parsed = JSON.parse(body || '{}');
    } catch (err) {
      throw new Error(`Respuesta inválida del servidor: ${body}`);
    }

    if (!parsed || parsed.success !== true) {
      throw new Error(`Error del servidor: ${body}`);
    }

    const cfgSheet = upsertConfigSheet_(SpreadsheetApp.getActiveSpreadsheet());
    const nextYear = resolveFallbackYearAfterDelete_(settings.baseUrl, year);
    cfgSheet.getRange('B2').setValue(nextYear || '');

    ui.alert(
      'Año eliminado',
      [
        `Año: ${year}`,
        `Directorio data eliminado: ${boolToTexto_(parsed.dataDirectoryRemoved)}`,
        `Archivos eliminados: ${parsed.filesDeleted || 0}`,
        `Metadatos actualizados: ${boolToTexto_(parsed.catalogUpdated)}`,
        `Estado de año removido: ${boolToTexto_(parsed.yearStatusRemoved)}`,
        nextYear ? `Config!B2 ajustado a: ${nextYear}` : 'Config!B2 quedó vacío. Define el siguiente año antes de publicar.'
      ].join('\n'),
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert(`Error al borrar año: ${err.message}`);
  }
}

function resolveFallbackYearAfterDelete_(baseUrl, deletedYear) {
  const catalogUrl = `${normalizeBaseUrl_(baseUrl)}/config/metadatos.json`;
  const response = UrlFetchApp.fetch(catalogUrl, {
    method: 'get',
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    return '';
  }

  const body = response.getContentText();
  let parsed = {};
  try {
    parsed = JSON.parse(body || '{}');
  } catch (err) {
    return '';
  }

  const defaultYear = String(parsed.defaultYear || '').trim();
  if (/^\d{4}$/.test(defaultYear) && defaultYear !== String(deletedYear)) {
    return defaultYear;
  }

  const years = Array.isArray(parsed.availableYears) ? parsed.availableYears : [];
  for (let i = 0; i < years.length; i++) {
    const candidate = String(years[i] || '').trim();
    if (/^\d{4}$/.test(candidate) && candidate !== String(deletedYear)) {
      return candidate;
    }
  }

  return '';
}

function boolToTexto_(value) {
  return value ? 'si' : 'no';
}
