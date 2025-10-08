import { state, selectCompareNut, selectCompareVul } from '../configuracion.js';
import { getIndicatorDisplayName } from './ayudantes.js';
import { createColorPalette } from './utilidades_color.js';
import { createLegend, createIndiceLegend, createPopupContent } from './componentes.js';

export function initMaps() {
    const cartoLightUrl = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
    const cartoAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: cartoAttribution
    });

    const baseLayers = {
        "Claro": L.tileLayer(cartoLightUrl, { attribution: cartoAttribution }),
        "Estándar": osm,
        "Oscuro": cartoDark
    };

    // Initialize maps
    // Main map gets the layer control and its own instance of the light layer
    state.maps.main = L.map('map-main', {
        fullscreenControl: true,
        layers: [baseLayers.Claro] // Default layer
    });
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(state.maps.main);

    // Comparison maps get their own instances of the light basemap and no layer control
    state.maps.compareVul = L.map('map-compare-vul', {
        fullscreenControl: true,
        layers: [L.tileLayer(cartoLightUrl, { attribution: cartoAttribution })]
    });

    state.maps.compareNut = L.map('map-compare-nut', {
        fullscreenControl: true,
        layers: [L.tileLayer(cartoLightUrl, { attribution: cartoAttribution })]
    });
}

export function updateMap(mapKey, indicatorId) {
    const map = state.maps[mapKey];
    if (!map) return;

    if (state.layers[mapKey]) map.removeLayer(state.layers[mapKey]);
    if (state.legends[mapKey]) map.removeControl(state.legends[mapKey]);

    const isNutritionMap = mapKey === 'compareNut';
    const data = isNutritionMap ? state.nutritionData : state.indexData;
    
    let palette, legend;
    const isIndice = indicatorId === 'Indice';

    // Define palette first
    if (isIndice && mapKey === 'main') {
        palette = (value) => {
            const classification = Object.values(state.indexData).find(d => d.Indice === value)?.Clasificacion_Indice;
            if (classification === 'Crítica') return '#B30000';
            if (classification === 'Alta') return '#E64519';
            if (classification === 'Media') return '#F9A825';
            if (classification === 'Baja') return '#8BC34A';
            if (classification === 'Mínima') return '#2E7D32';
            return '#d9d9d9';
        };
    } else {
        const values = Object.values(data).map(d => d[indicatorId]).filter(v => v != null);
        palette = createColorPalette(values, isNutritionMap);
    }

    const geoJsonLayer = L.geoJSON(state.geoData, {
        style: (feature) => {
            const deptCode = parseInt(feature.properties.DPTO_CCDGO);
            const value = data[deptCode] ? data[deptCode][indicatorId] : null;
            return {
                fillColor: palette(value),
                weight: 0.8,
                color: '#ffffff',
                fillOpacity: 0.85
            };
        },
        onEachFeature: (feature, layer) => {
            const deptCode = parseInt(feature.properties.DPTO_CCDGO);
            let deptName = (feature.properties.DPTO_CNMBR || feature.properties.name || 'Nombre no disponible').trim().toLowerCase();
            deptName = deptName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            layer.bindTooltip(deptName);
            layer.bindPopup(() => createPopupContent(deptCode, deptName, indicatorId, mapKey));

            layer.on({
                mouseover: (e) => {
                    e.target.isHovered = true;
                    e.target.setStyle({ weight: 2.5, color: '#2c3e50' });
                    e.target.bringToFront();

                    if (isIndice && mapKey === 'main') {
                        const classification = state.indexData[deptCode]?.Clasificacion_Indice;
                        if (classification) {
                            const legendContainer = state.legends.main.getContainer();
                            if (legendContainer) {
                                const legendItem = legendContainer.querySelector(`.legend-item[data-classification="${classification}"]`);
                                if (legendItem) legendItem.classList.add('highlighted');
                            }
                        }
                    }
                },
                mouseout: (e) => {
                    e.target.isHovered = false;
                    geoJsonLayer.resetStyle(e.target);

                    if (isIndice && mapKey === 'main') {
                        const classification = state.indexData[deptCode]?.Clasificacion_Indice;
                        if (classification) {
                            const legendContainer = state.legends.main.getContainer();
                            if (legendContainer) {
                                const legendItem = legendContainer.querySelector(`.legend-item[data-classification="${classification}"]`);
                                if (legendItem) legendItem.classList.remove('highlighted');
                            }
                        }
                    }
                },
                click: (e) => {
                    const clickedDeptCode = parseInt(e.target.feature.properties.DPTO_CCDGO);

                    // Only sync popups for comparison maps
                    if (mapKey === 'compareVul' || mapKey === 'compareNut') {
                        const otherMapKey = mapKey === 'compareVul' ? 'compareNut' : 'compareVul';
                        const otherMapLayer = state.layers[otherMapKey];

                        if (otherMapLayer) {
                            otherMapLayer.eachLayer(otherLayer => {
                                const otherDeptCode = parseInt(otherLayer.feature.properties.DPTO_CCDGO);
                                if (otherDeptCode === clickedDeptCode) {
                                    // Ensure the popup is opened on the next tick to avoid race conditions
                                    setTimeout(() => {
                                        otherLayer.openPopup();
                                    }, 0);
                                }
                            });
                        }
                    }
                }
            });
        }
    });

    // Now create legend, passing the layer if needed
    if (isIndice && mapKey === 'main') { 
        legend = createIndiceLegend(map, geoJsonLayer);
    } else {
        const legendTitle = isNutritionMap
            ? selectCompareNut.options[selectCompareNut.selectedIndex].text
            : getIndicatorDisplayName(indicatorId);
        const isPercentage = isNutritionMap;
        const values = Object.values(data).map(d => d[indicatorId]).filter(v => v != null);
        legend = createLegend(map, palette, values, legendTitle, isPercentage);
    }
    
    geoJsonLayer.addTo(map);
    state.layers[mapKey] = geoJsonLayer;

    legend.addTo(map);
    state.legends[mapKey] = legend;
}
