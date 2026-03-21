import { state, selectCompareNut, COLOMBIA_CENTER, INITIAL_ZOOM } from '../configuracion.js';
import { createLegendToggleControl } from './componentes.js';
import { updateVulnerabilityMap } from '../../src/tabs/vulnerability/map-controller.js';
import { updateCompareMap } from '../../src/tabs/compare/map-controller.js';
export { updateEvolutionMap } from '../../src/tabs/evolution/map-controller.js';

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
    if (mapKey === 'main') {
        updateVulnerabilityMap(indicatorId);
        return;
    }

    if (mapKey === 'compareVul' || mapKey === 'compareNut') {
        updateCompareMap(mapKey, indicatorId, selectCompareNut);
    }
}

