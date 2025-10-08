import { state, selectCompareNut } from '../configuracion.js';
import { getIndicatorDisplayName } from './ayudantes.js';
import { dim_icons } from '../icons.js';

export function createLegend(map, palette, values, title, isPercentage = false) {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend leaflet-legend');
        const domain = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);

        if (domain.length === 0) {
            div.innerHTML = `<h4>${title}</h4>No data`;
            return div;
        }

        const min = domain[0];
        const max = domain[domain.length - 1];

        const colors = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
        const gradient = `linear-gradient(to bottom, ${colors.join(', ')})`; // Light to dark, top to bottom
        const legendHeight = 180;

        const formatLabel = (value) => isPercentage ? `${(value * 100).toFixed(0)}%` : Math.round(value);

        // --- Generate labels with uniform spacing ---
        let labels = [];
        if (isPercentage) {
            const rangePercent = (max - min) * 100;
            let intervalPercent;
            if (rangePercent <= 5) {
                intervalPercent = 1; // 1% steps
            } else if (rangePercent <= 10) {
                intervalPercent = 2; // 2% steps
            } else if (rangePercent <= 25) {
                intervalPercent = 5; // 5% steps
            } else {
                intervalPercent = 10; // 10% steps
            }

            const startPercent = Math.ceil(min * 100 / intervalPercent) * intervalPercent;
            const endPercent = Math.floor(max * 100 / intervalPercent) * intervalPercent;

            for (let i = startPercent; i <= endPercent; i += intervalPercent) {
                labels.push(i / 100);
            }
        } else {
            const interval = 10; // 10-unit steps for vulnerability maps
            const start = Math.ceil(min / interval) * interval;
            const end = Math.floor(max / interval) * interval;

            for (let i = start; i <= end; i += interval) {
                labels.push(i);
            }
        }

        // If the range is too small to generate nice intervals, just show min and max.
        if (labels.length < 2) {
            labels = [min, max];
        }
        
        // Use unique sorted values
        labels = [...new Set(labels)].sort((a,b) => a - b);

        let labelsDivs = '';
        for (const val of labels) {
            const percentPosition = (max - min) > 0 ? (val - min) / (max - min) * 100 : 0;

            // Center all labels uniformly. This might cause slight clipping at the edges.
            const transform = 'translateY(-50%)';

            labelsDivs += `<div style="position: absolute; top: ${percentPosition}%; left: 0; width: 100%; transform: ${transform};"><span style="padding-left: 5px;">&ndash; ${formatLabel(val)}</span></div>`;
        }

        div.innerHTML = `
            <h4>${title}</h4>
            <div style="display: flex; align-items: stretch; height: ${legendHeight}px;">
                <div style="width: 20px; background: ${gradient};"></div>
                <div style="position: relative; width: 60px; font-size: 0.9em; margin-left: 5px;">
                    ${labelsDivs}
                </div>
            </div>
        `;
        return div;
    };
    return legend;
}

export function createIndiceLegend(map, geoJsonLayer) {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        // Create the new background div
        const backgroundDiv = L.DomUtil.create('div', 'legend-wrapper');
        backgroundDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // More transparent
        backgroundDiv.style.borderRadius = '8px'; // Slightly larger radius
        backgroundDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.25)'; // Broader, more diffuse shadow
        backgroundDiv.style.padding = '5px'; // Padding to make it larger than the foreground

        // Create the original legend div (foreground) and append it to the background
        const foregroundDiv = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded', backgroundDiv);
        
        // Styles for the original box
        foregroundDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
        foregroundDiv.style.padding = '8px';
        foregroundDiv.style.borderRadius = '5px';
        foregroundDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.2)'; // Keep original shadow for depth
        foregroundDiv.style.width = 'auto';
        foregroundDiv.style.minWidth = '350px';
        foregroundDiv.style.maxWidth = '90vw';

        const categories = [
            { label: "Mínima", range: "0-14", color: "#2E7D32" },
            { label: "Baja", range: "15-29", color: "#8BC34A" },
            { label: "Media", range: "30-49", color: "#F9A825" },
            { label: "Alta", range: "50-64", color: "#E64519" },
            { label: "Crítica", range: "65-100", color: "#B30000" }
        ];

        const titleHtml = `<h4 style='margin-top:0; margin-bottom:8px; font-size:0.95em; text-align:center; color: #333;'>Nivel de Vulnerabilidad</h4>`;
        
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

        // --- Event Listeners for Highlighting ---
        const highlightMapFeatures = (classification) => {
            if (!geoJsonLayer) return;
            geoJsonLayer.eachLayer(layer => {
                const deptData = state.indexData[layer.feature.properties.DPTO_CCDGO];
                if (deptData && deptData.Clasificacion_Indice === classification) {
                    layer.setStyle({ weight: 2.5, color: '#2c3e50' });
                    layer.bringToFront();
                }
            });
        };

        const clearMapHighlight = () => {
            if (geoJsonLayer) {
                geoJsonLayer.eachLayer(layer => {
                    // Avoid resetting the style of the layer that is currently being hovered
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
        
        // Stop propagation to prevent map clicks when interacting with the legend
        L.DomEvent.on(backgroundDiv, 'mousedown dblclick', L.DomEvent.stopPropagation);

        // Return the new wrapper
        return backgroundDiv;
    };
    return legend;
}

export function createPopupContent(deptCode, deptName, indicatorId, mapKey) {
    const isNutritionMap = mapKey === 'compareNut';
    const data = isNutritionMap ? state.nutritionData : state.indexData;
    const deptData = data[deptCode];

    if (!deptData) return `<strong>${deptName}</strong><br>Datos no disponibles`;

    // Handle Vulnerability Maps (main and compareVul)
    if (!isNutritionMap) {
        const isIndice = indicatorId === 'Indice';
        if (isIndice) {
            const idxVal = deptData.Indice !== null ? deptData.Indice.toFixed(1) : "N/A";
            const rank = deptData.Ranking || "N/A";
            const classification = deptData.Clasificacion_Indice || "N/A";

            let tableHtml = `<br><table class="popup-table"><tr><th>Dimensión</th><th>Valor</th></tr>`;
            const dimensions = Object.keys(deptData).filter(k => k !== 'Indice' && k !== 'Ranking' && k !== 'Clasificacion_Indice');

            for (const dim of dimensions) {
                const dimVal = deptData[dim] !== null ? deptData[dim].toFixed(1) : "N/A";
                const dimName = getIndicatorDisplayName(dim);
                const iconHTML = dim_icons[dim] || '';
                tableHtml += `<tr><td>${iconHTML} ${dimName}</td><td>${dimVal}</td></tr>`;
            }
            tableHtml += `</table>`;

            return `<strong>${deptName}</strong><br><b>Índice Integrado:</b> ${idxVal} (${classification})<br><b>Ranking General:</b> ${rank}${tableHtml}`;
        } else {
            const value = deptData[indicatorId];
            const displayName = getIndicatorDisplayName(indicatorId);
            const formattedValue = (value !== null && !isNaN(value)) ? value.toFixed(2) : "No disponible";
            return `<strong>${deptName}</strong><br><b>${displayName}:</b> ${formattedValue}`;
        }
    }
    // Handle Nutrition Map (compareNut)
    else {
        const value = deptData[indicatorId];
        const displayName = selectCompareNut.options[selectCompareNut.selectedIndex].text;
        const formattedValue = (value !== null && !isNaN(value)) ? `${(value * 100).toFixed(1)}%` : "No disponible";
        return `<strong>${deptName}</strong><br><b>${displayName}:</b> ${formattedValue}`;
    }
}
