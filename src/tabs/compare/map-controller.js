import { state } from '../../core/store.js';
import { getIndicatorDisplayName, getIndicatorValue } from '../../../js/logica_mapa/ayudantes.js';
import { createColorPalette } from '../../../js/logica_mapa/utilidades_color.js';
import { createLegend, createPopupContent } from '../../shared/map-components.js';

export function updateCompareMap(mapKey, indicatorId, compareNutSelectEl) {
    const map = state.maps[mapKey];
    if (!map) return;

    if (state.layers[mapKey]) map.removeLayer(state.layers[mapKey]);
    if (state.legends[mapKey]) map.removeControl(state.legends[mapKey]);

    const isNutritionMap = mapKey === 'compareNut';
    const data = isNutritionMap ? state.nutritionData : state.indexData;

    const values = Object.keys(data)
        .map((deptCode) => isNutritionMap ? data[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId))
        .filter((v) => v != null);

    const palette = createColorPalette(values, isNutritionMap);

    const toTitleCase = (name) => name
        .trim()
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const geoJsonLayer = L.geoJSON(state.geoData, {
        style: (feature) => {
            const deptCode = parseInt(feature.properties.DPTO_CCDGO, 10);
            const value = isNutritionMap
                ? (data[deptCode] ? data[deptCode][indicatorId] : null)
                : getIndicatorValue(deptCode, indicatorId);

            return {
                fillColor: palette(value),
                weight: 0.8,
                color: '#ffffff',
                fillOpacity: 0.85
            };
        },
        onEachFeature: (feature, layer) => {
            const deptCode = parseInt(feature.properties.DPTO_CCDGO, 10);
            const deptName = toTitleCase(feature.properties.DPTO_CNMBR || feature.properties.name || 'Nombre no disponible');

            layer.bindTooltip(deptName);
            layer.bindPopup(() => createPopupContent(deptCode, deptName, indicatorId, mapKey));

            layer.on({
                mouseover: (e) => {
                    e.target.setStyle({ weight: 2.5, color: '#2c3e50' });
                    e.target.bringToFront();
                },
                mouseout: (e) => {
                    geoJsonLayer.resetStyle(e.target);
                },
                click: (e) => {
                    const clickedDeptCode = parseInt(e.target.feature.properties.DPTO_CCDGO, 10);
                    const otherMapKey = mapKey === 'compareVul' ? 'compareNut' : 'compareVul';
                    const otherMapLayer = state.layers[otherMapKey];

                    if (otherMapLayer) {
                        otherMapLayer.eachLayer((otherLayer) => {
                            const otherDeptCode = parseInt(otherLayer.feature.properties.DPTO_CCDGO, 10);
                            if (otherDeptCode === clickedDeptCode) {
                                setTimeout(() => {
                                    otherLayer.openPopup();
                                }, 0);
                            }
                        });
                    }
                }
            });
        }
    });

    const legendTitle = isNutritionMap
        ? compareNutSelectEl?.options?.[compareNutSelectEl.selectedIndex]?.text || getIndicatorDisplayName(indicatorId)
        : getIndicatorDisplayName(indicatorId);

    const legend = createLegend(map, palette, values, legendTitle, isNutritionMap);

    geoJsonLayer.addTo(map);
    state.layers[mapKey] = geoJsonLayer;

    legend.addTo(map);
    state.legends[mapKey] = legend;
}
