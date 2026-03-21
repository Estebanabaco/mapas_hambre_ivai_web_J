import { state } from '../../core/store.js';
import { getIndicatorDisplayName, getIndicatorValue } from '../../../js/logica_mapa/ayudantes.js';
import { loadYearData } from '../../../js/manejo_datos.js';
import { createColorPalette } from '../../../js/logica_mapa/utilidades_color.js';
import {
    createEvolutionPopupContent,
    createContinuousLegendMarkup,
    createIndiceLegendMarkup
} from '../../shared/map-components.js';

let evolutionUpdateId = 0;

function getRoot() {
    return state.domRoot || document;
}

function getById(id) {
    const root = getRoot();
    return root.querySelector ? root.querySelector(`#${id}`) : null;
}

export async function updateEvolutionMap(indicatorId, baseYear, compareYear) {
    const mapBase = state.maps.evolutionBase;
    const mapCompare = state.maps.evolutionCompare;
    if (!mapBase || !mapCompare) return;

    const thisCallId = ++evolutionUpdateId;

    if (state.layers.evolutionBase) { mapBase.removeLayer(state.layers.evolutionBase); state.layers.evolutionBase = null; }
    if (state.layers.evolutionCompare) { mapCompare.removeLayer(state.layers.evolutionCompare); state.layers.evolutionCompare = null; }
    if (state.legends.evolutionBase) { mapBase.removeControl(state.legends.evolutionBase); state.legends.evolutionBase = null; }
    if (state.legends.evolutionCompare) { mapCompare.removeControl(state.legends.evolutionCompare); state.legends.evolutionCompare = null; }

    const sharedLegendHost = getById('evolution-shared-legend');
    const sharedLegendContent = getById('evolution-shared-legend-content');
    if (sharedLegendContent) {
        sharedLegendContent.innerHTML = '';
    }
    if (sharedLegendHost) {
        sharedLegendHost.style.display = '';
    }

    [mapBase, mapCompare].forEach(m => {
        const container = m.getContainer();
        if (container) {
            container.querySelectorAll('.legend-wrapper, .leaflet-legend').forEach(el => el.remove());
        }
    });

    const baseData = await loadYearData(baseYear);
    const compareData = await loadYearData(compareYear);
    if (!baseData || !compareData) return;

    if (thisCallId !== evolutionUpdateId) return;

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
                const deptCode = parseInt(feature.properties.DPTO_CCDGO, 10);
                const value = isNutritionMap ? (dataObj.nutritionData[deptCode] ? dataObj.nutritionData[deptCode][indicatorId] : null) : getIndicatorValue(deptCode, indicatorId, dataObj.indexData, dataObj.indicatorData);
                let fillColor = '#d9d9d9';
                if (isIndice) {
                    fillColor = palette(value, dataObj.indexData[deptCode]?.Clasificacion_Indice);
                } else if (value != null) {
                    fillColor = palette(value);
                }
                return {
                    fillColor,
                    weight: 0.8,
                    color: '#ffffff',
                    fillOpacity: 0.85
                };
            },
            onEachFeature: (feature, layerItem) => {
                const deptCode = parseInt(feature.properties.DPTO_CCDGO, 10);
                let deptName = (feature.properties.DPTO_CNMBR || feature.properties.name || '').trim().toLowerCase();
                deptName = deptName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                layersByDept[deptCode] = layerItem;
                layerItem.bindTooltip(`${deptName} (${yearStr})`);
                layerItem.bindPopup(() => createEvolutionPopupContent(deptCode, deptName, indicatorId, dataObj, yearStr, otherDataObj, otherYearStr), { maxWidth: 350 });
            }
        });
        layer._deptLayers = layersByDept;
        return layer;
    };

    state.layers.evolutionBase = createEvolutionLayer(baseData, baseYear, compareData, compareYear).addTo(mapBase);
    state.layers.evolutionCompare = createEvolutionLayer(compareData, compareYear, baseData, baseYear).addTo(mapCompare);

    const crossOpenPopup = (sourceDeptLayers, targetLayer) => {
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
    crossOpenPopup(state.layers.evolutionBase._deptLayers, state.layers.evolutionCompare);
    crossOpenPopup(state.layers.evolutionCompare._deptLayers, state.layers.evolutionBase);

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

    if (sharedLegendContent) {
        if (isIndice) {
            sharedLegendContent.innerHTML = createIndiceLegendMarkup();

            const highlightClassificationInLayer = (layerGroup, dataSource, classification) => {
                if (!layerGroup) return;
                layerGroup.eachLayer(layerItem => {
                    const deptCode = parseInt(layerItem.feature.properties.DPTO_CCDGO, 10);
                    const deptData = dataSource[deptCode];
                    if (deptData && deptData.Clasificacion_Indice === classification) {
                        layerItem.setStyle({ weight: 2.5, color: '#2c3e50' });
                        layerItem.bringToFront();
                    }
                });
            };

            const resetLayerStyles = (layerGroup) => {
                if (!layerGroup) return;
                layerGroup.eachLayer(layerItem => {
                    layerGroup.resetStyle(layerItem);
                });
            };

            const sharedLegendItems = sharedLegendContent.querySelectorAll('.legend-item[data-classification]');
            sharedLegendItems.forEach(item => {
                item.addEventListener('mouseover', () => {
                    const classification = item.dataset.classification;
                    highlightClassificationInLayer(state.layers.evolutionBase, baseData.indexData, classification);
                    highlightClassificationInLayer(state.layers.evolutionCompare, compareData.indexData, classification);
                });
                item.addEventListener('mouseout', () => {
                    resetLayerStyles(state.layers.evolutionBase);
                    resetLayerStyles(state.layers.evolutionCompare);
                });
            });
        } else {
            const legendTitle = `${getIndicatorDisplayName(indicatorId)}`;
            const isPercentage = isNutritionMap;
            const allValues = [
                ...Object.keys(baseData.indexData).map(deptCode => isNutritionMap ? baseData.nutritionData[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId, baseData.indexData, baseData.indicatorData)),
                ...Object.keys(compareData.indexData).map(deptCode => isNutritionMap ? compareData.nutritionData[deptCode]?.[indicatorId] : getIndicatorValue(deptCode, indicatorId, compareData.indexData, compareData.indicatorData))
            ].filter(v => v != null);

            sharedLegendContent.innerHTML = createContinuousLegendMarkup(allValues, legendTitle, isPercentage);
        }
    }
}
