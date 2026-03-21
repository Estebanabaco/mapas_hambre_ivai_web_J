import { state, selectCompareNut, selectCompareVul, COLOMBIA_CENTER, INITIAL_ZOOM } from '../configuracion.js';
import { getIndicatorDisplayName, getIndicatorValue } from './ayudantes.js';
import { loadYearData } from '../manejo_datos.js';
import { createColorPalette } from './utilidades_color.js';
import { createLegend, createIndiceLegend, createPopupContent, createEvolutionPopupContent, createLegendToggleControl } from './componentes.js';

export let currentTileLayers = { main: null, compareVul: null, compareNut: null, evolutionBase: null, evolutionCompare: null };

export function toggleMapTheme(isDark) {
    const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    
    ['main', 'compareVul', 'compareNut', 'evolutionBase', 'evolutionCompare'].forEach(key => {
        if (state.maps[key]) {
            if (currentTileLayers[key]) {
                state.maps[key].removeLayer(currentTileLayers[key]);
            }
            currentTileLayers[key] = L.tileLayer(tileUrl, { attribution }).addTo(state.maps[key]);
            currentTileLayers[key].bringToBack();
        }
    });
}

export function initMaps() {
    // Initialize maps without initial tile layers (will be added by toggleMapTheme)
    state.maps.main = L.map('map-main', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(state.maps.main);
    createLegendToggleControl(state.maps.main, 'main').addTo(state.maps.main);

    state.maps.compareVul = L.map('map-compare-vul', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(state.maps.compareVul);
    createLegendToggleControl(state.maps.compareVul, 'compareVul').addTo(state.maps.compareVul);

    state.maps.compareNut = L.map('map-compare-nut', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(state.maps.compareNut);
    createLegendToggleControl(state.maps.compareNut, 'compareNut').addTo(state.maps.compareNut);

    state.maps.evolutionBase = L.map('map-evolution-base', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    }).setView(COLOMBIA_CENTER, INITIAL_ZOOM);
    L.control.zoom({ position: 'topright' }).addTo(state.maps.evolutionBase);
    createLegendToggleControl(state.maps.evolutionBase, 'evolutionBase').addTo(state.maps.evolutionBase);

    state.maps.evolutionCompare = L.map('map-evolution-compare', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    }).setView(COLOMBIA_CENTER, INITIAL_ZOOM);
    L.control.zoom({ position: 'topright' }).addTo(state.maps.evolutionCompare);
    createLegendToggleControl(state.maps.evolutionCompare, 'evolutionCompare').addTo(state.maps.evolutionCompare);

    // Load saved or default theme
    const isDark = localStorage.getItem('theme') === 'dark';
    toggleMapTheme(isDark);
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
        const values = Object.keys(data).map(deptCode => isNutritionMap ? data[deptCode][indicatorId] : getIndicatorValue(deptCode, indicatorId)).filter(v => v != null);
        palette = createColorPalette(values, isNutritionMap);
    }

    const geoJsonLayer = L.geoJSON(state.geoData, {
        style: (feature) => {
            const deptCode = parseInt(feature.properties.DPTO_CCDGO);
            const value = isNutritionMap ? (data[deptCode] ? data[deptCode][indicatorId] : null) : getIndicatorValue(deptCode, indicatorId);
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
        const values = Object.keys(data).map(deptCode => isNutritionMap ? data[deptCode][indicatorId] : getIndicatorValue(deptCode, indicatorId)).filter(v => v != null);
        legend = createLegend(map, palette, values, legendTitle, isPercentage);
    }
    
    geoJsonLayer.addTo(map);
    state.layers[mapKey] = geoJsonLayer;

    legend.addTo(map);
    state.legends[mapKey] = legend;
}

let _evolutionUpdateId = 0;

export async function updateEvolutionMap(indicatorId, baseYear, compareYear) {
    const mapBase = state.maps.evolutionBase;
    const mapCompare = state.maps.evolutionCompare;
    if (!mapBase || !mapCompare) return;

    // Concurrency guard: increment ID so stale calls can detect they're outdated
    const thisCallId = ++_evolutionUpdateId;

    // Cleanup old layers and legends
    if (state.layers.evolutionBase) { mapBase.removeLayer(state.layers.evolutionBase); state.layers.evolutionBase = null; }
    if (state.layers.evolutionCompare) { mapCompare.removeLayer(state.layers.evolutionCompare); state.layers.evolutionCompare = null; }
    if (state.legends.evolutionBase) { mapBase.removeControl(state.legends.evolutionBase); state.legends.evolutionBase = null; }
    if (state.legends.evolutionCompare) { mapCompare.removeControl(state.legends.evolutionCompare); state.legends.evolutionCompare = null; }

    // Brute-force cleanup: remove any leftover legend DOM
    [mapBase, mapCompare].forEach(m => {
        const container = m.getContainer();
        if (container) {
            container.querySelectorAll('.legend-wrapper, .leaflet-legend').forEach(el => el.remove());
        }
    });

    const baseData = await loadYearData(baseYear);
    const compareData = await loadYearData(compareYear);
    if (!baseData || !compareData) return;

    // If a newer call has started while we were loading data, abort this stale one
    if (thisCallId !== _evolutionUpdateId) return;

    const isNutritionMap = (indicatorId === 'ENSIN' || indicatorId === 'Cronica' || indicatorId === 'R_Cronica' || indicatorId === 'Aguda' || indicatorId === 'R_Aguda');
    const isIndice = indicatorId === 'Indice';

    let palette;
    if (isIndice) {
        palette = (value, classification) => {
            if (classification === 'Crítica') return '#B30000';
            if (classification === 'Alta') return '#E64519';
            if (classification === 'Media') return '#F9A825';
            if (classification === 'Baja') return '#8BC34A';
            if (classification === 'Mínima') return '#2E7D32';
            return '#d9d9d9';
        };
    } else {
        const allValues = [
            ...Object.keys(baseData.indexData).map(deptCode => isNutritionMap ? baseData.nutritionData[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId, baseData.indexData, baseData.indicatorData)),
            ...Object.keys(compareData.indexData).map(deptCode => isNutritionMap ? compareData.nutritionData[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId, compareData.indexData, compareData.indicatorData))
        ].filter(v => v != null);
        palette = createColorPalette(allValues, isNutritionMap);
    }

    const createEvolutionLayer = (dataObj, yearStr, otherDataObj, otherYearStr) => {
        const layersByDept = {};
        const layer = L.geoJSON(state.geoData, {
            style: (feature) => {
                const deptCode = parseInt(feature.properties.DPTO_CCDGO);
                const value = isNutritionMap ? (dataObj.nutritionData[deptCode] ? dataObj.nutritionData[deptCode][indicatorId] : null) : getIndicatorValue(deptCode, indicatorId, dataObj.indexData, dataObj.indicatorData);
                let fillColor = '#d9d9d9';
                if (isIndice) {
                    fillColor = palette(value, dataObj.indexData[deptCode]?.Clasificacion_Indice);
                } else if (value != null) {
                    fillColor = palette(value);
                }
                return {
                    fillColor: fillColor,
                    weight: 0.8,
                    color: '#ffffff',
                    fillOpacity: 0.85
                };
            },
            onEachFeature: (feature, l) => {
                const deptCode = parseInt(feature.properties.DPTO_CCDGO);
                let deptName = (feature.properties.DPTO_CNMBR || feature.properties.name || '').trim().toLowerCase();
                deptName = deptName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                const value = isNutritionMap ? (dataObj.nutritionData[deptCode] ? dataObj.nutritionData[deptCode][indicatorId] : null) : getIndicatorValue(deptCode, indicatorId, dataObj.indexData, dataObj.indicatorData);
                
                layersByDept[deptCode] = l;
                l.bindTooltip(`${deptName} (${yearStr})`);
                l.bindPopup(() => createEvolutionPopupContent(deptCode, deptName, indicatorId, dataObj, yearStr, otherDataObj, otherYearStr), { maxWidth: 350 });
            }
        });
        layer._deptLayers = layersByDept;
        return layer;
    };

    state.layers.evolutionBase = createEvolutionLayer(baseData, baseYear, compareData, compareYear).addTo(mapBase);
    state.layers.evolutionCompare = createEvolutionLayer(compareData, compareYear, baseData, baseYear).addTo(mapCompare);

    // Cross-map popup sync: clicking a department on one map opens its popup on the other
    const crossOpenPopup = (sourceDeptLayers, targetLayer, targetMap) => {
        Object.keys(sourceDeptLayers).forEach(deptCode => {
            sourceDeptLayers[deptCode].on('click', () => {
                const sibling = targetLayer._deptLayers[deptCode];
                if (sibling) {
                    const center = sibling.getBounds().getCenter();
                    sibling.openPopup(center);
                }
            });
        });
    };
    crossOpenPopup(state.layers.evolutionBase._deptLayers, state.layers.evolutionCompare, mapCompare);
    crossOpenPopup(state.layers.evolutionCompare._deptLayers, state.layers.evolutionBase, mapBase);

    if (!state.evolutionMapFitted) {
        const mainlandGeoData = {
            ...state.geoData,
            features: state.geoData.features.filter(f => f.properties.DPTO_CCDGO !== '88')
        };
        const geoJsonLayer = L.geoJSON(mainlandGeoData);
        const bounds = geoJsonLayer.getBounds();
        
        mapBase.fitBounds(bounds, { padding: [10, 10] });
        mapCompare.fitBounds(bounds, { padding: [10, 10] });
        
        mapBase.sync(mapCompare);
        mapCompare.sync(mapBase);

        state.evolutionMapFitted = true;
    }

    let legendBase, legendCompare;
    if (isIndice) {
        legendBase = createIndiceLegend(mapBase, state.layers.evolutionBase);
        legendCompare = createIndiceLegend(mapCompare, state.layers.evolutionCompare);
    } else {
        const legendTitle = `${getIndicatorDisplayName(indicatorId)}`;

        const isPercentage = isNutritionMap;
        const allValues = [
            ...Object.keys(baseData.indexData).map(deptCode => isNutritionMap ? baseData.nutritionData[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId, baseData.indexData, baseData.indicatorData)),
            ...Object.keys(compareData.indexData).map(deptCode => isNutritionMap ? compareData.nutritionData[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId, compareData.indexData, compareData.indicatorData))
        ].filter(v => v != null);
        legendBase = createLegend(mapBase, palette, allValues, legendTitle, isPercentage);
        legendCompare = createLegend(mapCompare, palette, allValues, legendTitle, isPercentage);
    }
    
    legendBase.addTo(mapBase);
    legendCompare.addTo(mapCompare);
    state.legends.evolutionBase = legendBase;
    state.legends.evolutionCompare = legendCompare;
}
