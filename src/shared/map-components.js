import { state, selectCompareNut } from '../../js/configuracion.js';
import { getIndicatorDisplayName, getIndicatorValue } from '../../js/logica_mapa/ayudantes.js';
import { dim_icons, sub_icons } from '../../js/icons.js';

export function createContinuousLegendMarkup(values, title, isPercentage = false) {
    const domain = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);
    if (domain.length === 0) {
        return `<div class="leaflet-legend evolution-shared-legend-box"><h4>${title}</h4>No data</div>`;
    }

    const min = domain[0];
    const max = domain[domain.length - 1];
    const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    const gradient = `linear-gradient(to bottom, ${colors.join(', ')})`;
    const legendHeight = 180;

    const formatLabel = (value) => isPercentage ? `${(value * 100).toFixed(0)}%` : Math.round(value);

    let labels = [];
    if (isPercentage) {
        const rangePercent = (max - min) * 100;
        let intervalPercent;
        if (rangePercent <= 5) intervalPercent = 1;
        else if (rangePercent <= 10) intervalPercent = 2;
        else if (rangePercent <= 25) intervalPercent = 5;
        else intervalPercent = 10;

        const startPercent = Math.ceil(min * 100 / intervalPercent) * intervalPercent;
        const endPercent = Math.floor(max * 100 / intervalPercent) * intervalPercent;
        for (let i = startPercent; i <= endPercent; i += intervalPercent) {
            labels.push(i / 100);
        }
    } else {
        const interval = 10;
        const start = Math.ceil(min / interval) * interval;
        const end = Math.floor(max / interval) * interval;
        for (let i = start; i <= end; i += interval) {
            labels.push(i);
        }
    }

    if (labels.length < 2) {
        labels = [min, max];
    }
    labels = [...new Set(labels)].sort((a, b) => a - b);

    let labelsDivs = '';
    for (const val of labels) {
        const percentPosition = (max - min) > 0 ? (val - min) / (max - min) * 100 : 0;
        labelsDivs += `<div style="position: absolute; top: ${percentPosition}%; left: 0; width: 100%; transform: translateY(-50%);"><span style="padding-left: 5px;">&ndash; ${formatLabel(val)}</span></div>`;
    }

    return `
        <div class="leaflet-legend leaflet-control-layers leaflet-control-layers-expanded evolution-shared-legend-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; font-size: 0.95em; color: #333;">${title}</h4>
            </div>
            <div style="display: flex; align-items: stretch; height: ${legendHeight}px; margin-top: 8px;">
                <div style="width: 20px; background: ${gradient};"></div>
                <div style="position: relative; width: 60px; font-size: 0.9em; margin-left: 5px;">
                    ${labelsDivs}
                </div>
            </div>
        </div>
    `;
}

export function createIndiceLegendMarkup() {
    const categories = [
        { label: 'Mínima', range: '0-14', color: '#2E7D32' },
        { label: 'Baja', range: '15-29', color: '#8BC34A' },
        { label: 'Media', range: '30-49', color: '#F9A825' },
        { label: 'Alta', range: '50-64', color: '#E64519' },
        { label: 'Crítica', range: '65-100', color: '#B30000' }
    ];

    const legendItemsHtml = categories.map(c => `
        <div class="legend-item" data-classification="${c.label}" style="flex-grow: 1; text-align: center; font-size: 0.75em; line-height: 1.1; padding: 4px 2px; border-radius: 3px;">
            <div style="background-color:${c.color}; height: 15px; border: 1px solid #999; margin-bottom: 3px;"></div>
            <div style="color: #333;">${c.label}</div>
            <div style="color: #555; font-size:0.9em;">${c.range}</div>
        </div>
    `).join('');

    return `
        <div class="legend-wrapper evolution-shared-indice-wrapper">
            <div class="leaflet-control-layers leaflet-control-layers-expanded evolution-shared-legend-box" style="min-width: 350px; max-width: 90vw;">
                <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin:0; font-size:0.95em; color: #333;">Nivel de Vulnerabilidad</h4>
                </div>
                <div style="display: flex; width: 100%; justify-content: space-around;">${legendItemsHtml}</div>
            </div>
        </div>
    `;
}

export function createLegend(map, palette, values, title, isPercentage = false) {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend leaflet-legend leaflet-control-layers leaflet-control-layers-expanded');
        div.style.backgroundColor = 'rgba(255,255,255,0.9)';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';

        const domain = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);

        if (domain.length === 0) {
            div.innerHTML = `<h4>${title}</h4>No data`;
            return div;
        }

        const min = domain[0];
        const max = domain[domain.length - 1];

        const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
        const gradient = `linear-gradient(to bottom, ${colors.join(', ')})`;
        const legendHeight = 180;

        const formatLabel = (value) => isPercentage ? `${(value * 100).toFixed(0)}%` : Math.round(value);

        let labels = [];
        if (isPercentage) {
            const rangePercent = (max - min) * 100;
            let intervalPercent;
            if (rangePercent <= 5) {
                intervalPercent = 1;
            } else if (rangePercent <= 10) {
                intervalPercent = 2;
            } else if (rangePercent <= 25) {
                intervalPercent = 5;
            } else {
                intervalPercent = 10;
            }

            const startPercent = Math.ceil(min * 100 / intervalPercent) * intervalPercent;
            const endPercent = Math.floor(max * 100 / intervalPercent) * intervalPercent;

            for (let i = startPercent; i <= endPercent; i += intervalPercent) {
                labels.push(i / 100);
            }
        } else {
            const interval = 10;
            const start = Math.ceil(min / interval) * interval;
            const end = Math.floor(max / interval) * interval;

            for (let i = start; i <= end; i += interval) {
                labels.push(i);
            }
        }

        if (labels.length < 2) {
            labels = [min, max];
        }

        labels = [...new Set(labels)].sort((a, b) => a - b);

        let labelsDivs = '';
        for (const val of labels) {
            const percentPosition = (max - min) > 0 ? (val - min) / (max - min) * 100 : 0;
            const transform = 'translateY(-50%)';

            labelsDivs += `<div style="position: absolute; top: ${percentPosition}%; left: 0; width: 100%; transform: ${transform};"><span style="padding-left: 5px;">&ndash; ${formatLabel(val)}</span></div>`;
        }

        const mapId = map.getContainer().id;
        const isCompareMap = mapId === 'map-compare-vul' || mapId === 'map-compare-nut';
        const infoButtonHtml = isCompareMap ? '' : `<button class="legend-info-btn" id="legend-info-btn-${mapId}"><i class="fas fa-info-circle"></i></button>`;

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; font-size: 0.95em; color: #333;">${title}</h4>
                ${infoButtonHtml}
            </div>
            <div style="display: flex; align-items: stretch; height: ${legendHeight}px; margin-top: 8px;">
                <div style="width: 20px; background: ${gradient};"></div>
                <div style="position: relative; width: 60px; font-size: 0.9em; margin-left: 5px;">
                    ${labelsDivs}
                </div>
            </div>
        `;

        const infoButton = div.querySelector(`#legend-info-btn-${mapId}`);
        if (infoButton) {
            infoButton.addEventListener('click', (e) => {
                e.stopPropagation();

                let indicatorId;
                if (mapId === 'map-main') {
                    indicatorId = state.currentIndicator;
                } else if (mapId === 'map-compare-vul') {
                    const select = document.getElementById('select-compare-vul');
                    indicatorId = select.value;
                } else if (mapId === 'map-compare-nut') {
                    const select = document.getElementById('select-compare-nut');
                    indicatorId = select.value;
                }

                const modal = document.getElementById('legend-info-modal');
                const modalBody = document.getElementById('legend-info-body');
                const modalTitle = document.getElementById('legend-info-title');

                const popupContent = createMoreInfoPopup(indicatorId);
                const displayName = getIndicatorDisplayName(indicatorId);

                modalTitle.innerHTML = `${dim_icons[indicatorId] || ''} ${displayName}`;
                modalBody.innerHTML = popupContent;
                modal.style.display = 'block';
            });
        }

        L.DomEvent.on(div, 'mousedown dblclick', L.DomEvent.stopPropagation);

        return div;
    };
    return legend;
}

export function createIndiceLegend(map, geoJsonLayer) {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const backgroundDiv = L.DomUtil.create('div', 'legend-wrapper');
        backgroundDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        backgroundDiv.style.borderRadius = '8px';
        backgroundDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.25)';
        backgroundDiv.style.padding = '5px';

        const foregroundDiv = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded', backgroundDiv);
        foregroundDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
        foregroundDiv.style.padding = '8px';
        foregroundDiv.style.borderRadius = '5px';
        foregroundDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.2)';
        foregroundDiv.style.width = 'auto';
        foregroundDiv.style.minWidth = '350px';
        foregroundDiv.style.maxWidth = '90vw';

        const categories = [
            { label: 'Mínima', range: '0-14', color: '#2E7D32' },
            { label: 'Baja', range: '15-29', color: '#8BC34A' },
            { label: 'Media', range: '30-49', color: '#F9A825' },
            { label: 'Alta', range: '50-64', color: '#E64519' },
            { label: 'Crítica', range: '65-100', color: '#B30000' }
        ];

        const titleHtml = `
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
                <h4 style='margin:0; font-size:0.95em; color: #333;'>Nivel de Vulnerabilidad</h4>
                <button class="legend-info-btn" id="legend-info-btn-main" style="margin-left: 10px;"><i class="fas fa-info-circle"></i></button>
            </div>
        `;

        const legendItemsHtml = categories.map(c => `
            <div class="legend-item" data-classification="${c.label}" style="flex-grow: 1; text-align: center; font-size: 0.75em; line-height: 1.1; padding: 4px 2px; border-radius: 3px;">
                <div style="background-color:${c.color}; height: 15px; border: 1px solid #999; margin-bottom: 3px;"></div>
                <div style='color: #333;'>${c.label}</div>
                <div style='color: #555; font-size:0.9em;'>${c.range}</div>
            </div>
        `).join('');

        foregroundDiv.innerHTML = `
            ${titleHtml}
            <div style='display: flex; width: 100%; justify-content: space-around;'>${legendItemsHtml}</div>
        `;

        const infoButton = foregroundDiv.querySelector('#legend-info-btn-main');
        if (infoButton) {
            infoButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const indicatorId = 'Indice';

                const modal = document.getElementById('legend-info-modal');
                const modalBody = document.getElementById('legend-info-body');
                const modalTitle = document.getElementById('legend-info-title');

                const popupContent = createMoreInfoPopup(indicatorId);
                const displayName = getIndicatorDisplayName(indicatorId);

                modalTitle.innerHTML = `${dim_icons[indicatorId] || ''} ${displayName}`;
                modalBody.innerHTML = popupContent;
                modal.style.display = 'block';
            });
        }

        const highlightMapFeatures = (classification) => {
            if (!geoJsonLayer) return;
            geoJsonLayer.eachLayer(layer => {
                const deptCode = parseInt(layer.feature.properties.DPTO_CCDGO, 10);
                const deptData = state.indexData[deptCode];
                if (deptData && deptData.Clasificacion_Indice === classification) {
                    layer.setStyle({ weight: 2.5, color: '#2c3e50' });
                    layer.bringToFront();
                }
            });
        };

        const clearMapHighlight = () => {
            if (geoJsonLayer) {
                geoJsonLayer.eachLayer(layer => {
                    if (!layer.isHovered) {
                        geoJsonLayer.resetStyle(layer);
                    }
                });
            }
        };

        foregroundDiv.querySelectorAll('.legend-item').forEach(item => {
            item.addEventListener('mouseover', () => {
                highlightMapFeatures(item.dataset.classification);
            });
            item.addEventListener('mouseout', () => {
                clearMapHighlight();
            });
        });

        L.DomEvent.on(backgroundDiv, 'mousedown dblclick', L.DomEvent.stopPropagation);

        return backgroundDiv;
    };
    return legend;
}

export function createPopupContent(deptCode, deptName, indicatorId, mapKey) {
    const isNutritionMap = mapKey === 'compareNut';
    const data = isNutritionMap ? state.nutritionData : state.indexData;
    const deptData = data[deptCode];

    if (!deptData) return `<strong>${deptName}</strong><br>Datos no disponibles`;

    if (!isNutritionMap) {
        const isIndice = indicatorId === 'Indice';
        if (isIndice) {
            const idxVal = deptData.Indice !== null ? deptData.Indice.toFixed(1) : 'N/A';
            const rank = deptData.Ranking || 'N/A';
            const classification = deptData.Clasificacion_Indice || 'N/A';

            let tableHtml = '<br><table class="popup-table"><tr><th>Dimensión</th><th>Valor</th></tr>';
            const dimensions = Object.keys(deptData).filter(k => k !== 'Indice' && k !== 'Ranking' && k !== 'Clasificacion_Indice');

            dimensions.sort((a, b) => (deptData[b] || 0) - (deptData[a] || 0));

            for (const dim of dimensions) {
                const dimVal = deptData[dim] !== null ? deptData[dim].toFixed(1) : 'N/A';
                const dimName = getIndicatorDisplayName(dim);
                const iconHTML = dim_icons[dim] || '';
                tableHtml += `<tr><td>${iconHTML} ${dimName}</td><td>${dimVal}</td></tr>`;
            }
            tableHtml += '</table>';

            return `<strong>${deptName}</strong><br><b>Índice Integrado:</b> ${idxVal} (${classification})<br><b>Ranking General:</b> ${rank}${tableHtml}`;
        }

        const value = getIndicatorValue(deptCode, indicatorId);
        const displayName = getIndicatorDisplayName(indicatorId);
        const formattedValue = (value !== null && !isNaN(value)) ? (value % 1 !== 0 ? value.toFixed(2) : value) : 'No disponible';

        const dimConfig = state.appConfig[indicatorId];
        let childTableHtml = '';
        if (dimConfig && dimConfig.variables && dimConfig.variables.length > 0) {
            childTableHtml = '<br><table class="popup-table"><tr><th>Indicador</th><th>Valor</th></tr>';
            const sortedVars = [...dimConfig.variables].sort((a, b) => {
                const valA = getIndicatorValue(deptCode, a.nombre) || 0;
                const valB = getIndicatorValue(deptCode, b.nombre) || 0;
                return valB - valA;
            });
            for (const v of sortedVars) {
                const childVal = getIndicatorValue(deptCode, v.nombre);
                const fmtVal = (childVal !== null && !isNaN(childVal)) ? (childVal % 1 !== 0 ? childVal.toFixed(2) : childVal) : 'N/A';
                const iconClass = sub_icons[v.nombre] || 'fa-solid fa-circle-dot';
                const parentIconHtml = dim_icons[indicatorId] || '';
                const colorMatch = parentIconHtml.match(/style="color:\s*([^;]+);"/);
                const iconColor = (colorMatch && colorMatch[1]) ? colorMatch[1] : '#666';
                const iconHtml = `<i class="${iconClass}" style="color: ${iconColor}; margin-right: 4px;"></i>`;
                childTableHtml += `<tr><td>${iconHtml} ${v.nombre}</td><td>${fmtVal}</td></tr>`;
            }
            childTableHtml += '</table>';
        }

        return `<strong>${deptName}</strong><br><b>${displayName}:</b> ${formattedValue}${childTableHtml}`;
    }

    const value = deptData[indicatorId];
    const displayName = selectCompareNut.options[selectCompareNut.selectedIndex].text;
    const formattedValue = (value !== null && !isNaN(value)) ? `${(value * 100).toFixed(1)}%` : 'No disponible';
    return `<strong>${deptName}</strong><br><b>${displayName}:</b> ${formattedValue}`;
}

export function createEvolutionPopupContent(deptCode, deptName, indicatorId, dataObj, yearStr, compareDataObj = null, compareYearStr = null) {
    const createTrendHtml = (currentValue, compareValue) => {
        const compareLabel = compareYearStr || 'el ano comparado';
        if (currentValue === null || currentValue === undefined || isNaN(currentValue)) return '';
        if (compareValue === null || compareValue === undefined || isNaN(compareValue)) return '';

        if (currentValue > compareValue) {
            return `<span class="trend-indicator trend-up" title="Subio frente a ${compareLabel}"><i class="fa-solid fa-arrow-up"></i></span>`;
        }
        if (currentValue < compareValue) {
            return `<span class="trend-indicator trend-down" title="Bajo frente a ${compareLabel}"><i class="fa-solid fa-arrow-down"></i></span>`;
        }
        return `<span class="trend-indicator trend-flat" title="Sin cambio frente a ${compareLabel}"><i class="fa-solid fa-minus"></i></span>`;
    };

    const formatNumeric = (value, digits = 2) => {
        if (value === null || value === undefined || isNaN(value)) return 'No disponible';
        return (value % 1 !== 0) ? value.toFixed(digits) : value;
    };

    const isNutritionIndicator = (indicatorId === 'ENSIN' || indicatorId === 'Cronica' || indicatorId === 'R_Cronica' || indicatorId === 'Aguda' || indicatorId === 'R_Aguda');

    if (isNutritionIndicator) {
        const value = dataObj.nutritionData[deptCode] ? dataObj.nutritionData[deptCode][indicatorId] : null;
        const compareValue = compareDataObj && compareDataObj.nutritionData[deptCode]
            ? compareDataObj.nutritionData[deptCode][indicatorId]
            : null;
        const displayName = getIndicatorDisplayName(indicatorId);
        const formattedValue = (value !== null && !isNaN(value)) ? `${(value * 100).toFixed(1)}%` : 'No disponible';
        const trendHtml = createTrendHtml(value, compareValue);
        return `<strong>${deptName} (${yearStr})</strong><br><b>${displayName}:</b> ${formattedValue} ${trendHtml}`;
    }

    const deptData = dataObj.indexData[deptCode];
    if (!deptData) return `<strong>${deptName} (${yearStr})</strong><br>Datos no disponibles`;

    const isIndice = indicatorId === 'Indice';
    if (isIndice) {
        const idxVal = deptData.Indice !== null ? deptData.Indice.toFixed(1) : 'N/A';
        const compareDeptData = compareDataObj ? compareDataObj.indexData[deptCode] : null;
        const idxCompareVal = compareDeptData ? compareDeptData.Indice : null;
        const idxTrendHtml = createTrendHtml(deptData.Indice, idxCompareVal);
        const rank = deptData.Ranking || 'N/A';
        const classification = deptData.Clasificacion_Indice || 'N/A';

        let tableHtml = '<br><table class="popup-table"><tr><th>Dimensión</th><th>Valor</th></tr>';
        const dimensions = Object.keys(deptData).filter(k => k !== 'Indice' && k !== 'Ranking' && k !== 'Clasificacion_Indice');
        dimensions.sort((a, b) => (deptData[b] || 0) - (deptData[a] || 0));

        for (const dim of dimensions) {
            const dimVal = deptData[dim] !== null ? deptData[dim].toFixed(1) : 'N/A';
            const compareDimVal = compareDeptData ? compareDeptData[dim] : null;
            const dimTrendHtml = createTrendHtml(deptData[dim], compareDimVal);
            const dimName = getIndicatorDisplayName(dim);
            const iconHTML = dim_icons[dim] || '';
            tableHtml += `<tr><td>${iconHTML} ${dimName}</td><td>${dimVal} ${dimTrendHtml}</td></tr>`;
        }
        tableHtml += '</table>';

        return `<strong>${deptName} (${yearStr})</strong><br><b>Índice Integrado:</b> ${idxVal} ${idxTrendHtml} (${classification})<br><b>Ranking General:</b> ${rank}${tableHtml}`;
    }

    const value = getIndicatorValue(deptCode, indicatorId, dataObj.indexData, dataObj.indicatorData);
    const compareValue = compareDataObj
        ? getIndicatorValue(deptCode, indicatorId, compareDataObj.indexData, compareDataObj.indicatorData)
        : null;
    const trendHtml = createTrendHtml(value, compareValue);
    const displayName = getIndicatorDisplayName(indicatorId);
    const formattedValue = formatNumeric(value, 2);

    const dimConfig = state.appConfig[indicatorId];
    let childTableHtml = '';
    if (dimConfig && dimConfig.variables && dimConfig.variables.length > 0) {
        childTableHtml = '<br><table class="popup-table"><tr><th>Indicador</th><th>Valor</th></tr>';
        const sortedVars = [...dimConfig.variables].sort((a, b) => {
            const valA = getIndicatorValue(deptCode, a.nombre, dataObj.indexData, dataObj.indicatorData) || 0;
            const valB = getIndicatorValue(deptCode, b.nombre, dataObj.indexData, dataObj.indicatorData) || 0;
            return valB - valA;
        });
        for (const v of sortedVars) {
            const childVal = getIndicatorValue(deptCode, v.nombre, dataObj.indexData, dataObj.indicatorData);
            const compareChildVal = compareDataObj
                ? getIndicatorValue(deptCode, v.nombre, compareDataObj.indexData, compareDataObj.indicatorData)
                : null;
            const childTrendHtml = createTrendHtml(childVal, compareChildVal);
            const fmtVal = formatNumeric(childVal, 2);
            const iconClass = sub_icons[v.nombre] || 'fa-solid fa-circle-dot';
            const parentIconHtml = dim_icons[indicatorId] || '';
            const colorMatch = parentIconHtml.match(/style="color:\s*([^;]+);"/);
            const iconColor = (colorMatch && colorMatch[1]) ? colorMatch[1] : '#666';
            const iconHtml = `<i class="${iconClass}" style="color: ${iconColor}; margin-right: 4px;"></i>`;
            childTableHtml += `<tr><td>${iconHtml} ${v.nombre}</td><td>${fmtVal} ${childTrendHtml}</td></tr>`;
        }
        childTableHtml += '</table>';
    }

    return `<strong>${deptName} (${yearStr})</strong><br><b>${displayName}:</b> ${formattedValue} ${trendHtml}${childTableHtml}`;
}

export function createLegendToggleControl(map, mapKey) {
    const control = L.control({ position: 'topright' });
    control.onAdd = function() {
        const button = L.DomUtil.create('a', 'leaflet-control leaflet-control-custom');
        button.innerHTML = '<i class="fa-solid fa-list-ul" style="font-size: 1.2rem;"></i>';
        button.href = '#';
        button.role = 'button';
        button.title = 'Mostrar/Ocultar leyenda';

        L.DomEvent.disableClickPropagation(button);

        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.stop(e);

            if (mapKey === 'evolutionBase' || mapKey === 'evolutionCompare') {
                const sharedLegend = document.getElementById('evolution-shared-legend');
                if (sharedLegend) {
                    if (sharedLegend.style.display === 'none') {
                        sharedLegend.style.display = '';
                    } else {
                        sharedLegend.style.display = 'none';
                    }
                }
                return;
            }

            const legend = state.legends[mapKey];
            if (legend) {
                const container = legend.getContainer();
                if (container) {
                    if (container.style.display === 'none') {
                        container.style.display = '';
                    } else {
                        container.style.display = 'none';
                    }
                }
            }
        });

        return button;
    };
    return control;
}

export function createMoreInfoPopup(indicatorId) {
    const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
    const config = state.appConfig[configKey];

    if (!config) {
        const indConfig = state.indicatorConfig ? state.indicatorConfig[indicatorId] : null;
        if (indConfig) {
            return `
                <p>${indConfig.descripcion || ''}</p>
                ${indConfig.unidad_medida ? `<p><strong>Unidad de medida:</strong> ${indConfig.unidad_medida}</p>` : ''}
            `;
        }
        return '<p>No hay descripción disponible para este indicador.</p>';
    }

    if (config.variables) {
        config.variables.sort((a, b) => (b.peso || 0) - (a.peso || 0));
    }
    const variablesHtml = config.variables ? config.variables.map(v => `<li>${v.nombre} ${v.peso ? `(${(v.peso * 100).toFixed(1)}%)` : ''}</li>`).join('') : '';

    return `
        <p>${config.descripcion}</p>
        ${variablesHtml ? `<div class="section-title">${indicatorId === 'Indice' ? 'Dimensiones Incluidas (y sus pesos)' : 'Variables Incluidas'}:</div><ul>${variablesHtml}</ul>` : ''}
    `;
}
