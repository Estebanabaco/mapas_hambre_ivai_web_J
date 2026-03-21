import { state, selectCompareNut, COLOMBIA_CENTER, INITIAL_ZOOM } from '../configuracion.js';
import { createLegendToggleControl } from './componentes.js';
import { updateVulnerabilityMap } from '../../src/tabs/vulnerability/map-controller.js';
import { updateCompareMap } from '../../src/tabs/compare/map-controller.js';
export { updateEvolutionMap } from '../../src/tabs/evolution/map-controller.js';

export let currentTileLayers = { main: null, compareVul: null, compareNut: null, evolutionBase: null, evolutionCompare: null };

export function resetMapRuntime() {
    currentTileLayers = { main: null, compareVul: null, compareNut: null, evolutionBase: null, evolutionCompare: null };
}

function getRoot() {
    return state.domRoot || document;
}

function getById(id) {
    const root = getRoot();
    return root.querySelector ? root.querySelector(`#${id}`) : null;
}

function readTheme(themeStorageKey) {
    const storage = state.appOptions?.storage;
    if (storage && typeof storage.getItem === 'function') {
        return storage.getItem(themeStorageKey);
    }

    try {
        return localStorage.getItem(themeStorageKey);
    } catch (error) {
        return null;
    }
}

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
    const mapMainEl = getById('map-main');
    const mapCompareVulEl = getById('map-compare-vul');
    const mapCompareNutEl = getById('map-compare-nut');
    const mapEvolutionBaseEl = getById('map-evolution-base');
    const mapEvolutionCompareEl = getById('map-evolution-compare');

    if (!mapMainEl || !mapCompareVulEl || !mapCompareNutEl || !mapEvolutionBaseEl || !mapEvolutionCompareEl) {
        throw new Error('No se encontraron todos los contenedores de mapa en el root activo.');
    }

    // Initialize maps without initial tile layers (will be added by toggleMapTheme)
    state.maps.main = L.map(mapMainEl, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(state.maps.main);
    createLegendToggleControl(state.maps.main, 'main').addTo(state.maps.main);

    state.maps.compareVul = L.map(mapCompareVulEl, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(state.maps.compareVul);
    createLegendToggleControl(state.maps.compareVul, 'compareVul').addTo(state.maps.compareVul);

    state.maps.compareNut = L.map(mapCompareNutEl, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(state.maps.compareNut);
    createLegendToggleControl(state.maps.compareNut, 'compareNut').addTo(state.maps.compareNut);

    state.maps.evolutionBase = L.map(mapEvolutionBaseEl, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    }).setView(COLOMBIA_CENTER, INITIAL_ZOOM);
    L.control.zoom({ position: 'topright' }).addTo(state.maps.evolutionBase);
    createLegendToggleControl(state.maps.evolutionBase, 'evolutionBase').addTo(state.maps.evolutionBase);

    state.maps.evolutionCompare = L.map(mapEvolutionCompareEl, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false
    }).setView(COLOMBIA_CENTER, INITIAL_ZOOM);
    L.control.zoom({ position: 'topright' }).addTo(state.maps.evolutionCompare);
    createLegendToggleControl(state.maps.evolutionCompare, 'evolutionCompare').addTo(state.maps.evolutionCompare);

    // Load saved or default theme
    const themeStorageKey = state.appOptions?.themeStorageKey || 'ivai-theme';
    const isDark = readTheme(themeStorageKey) === 'dark';
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

