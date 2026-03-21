// --- STATE AND CONSTANTS ---
export const state = {
    indexData: {},
    nutritionData: {},
    geoData: null,
    indicatorData: {},
    indicatorConfig: {},
    currentIndicator: 'Indice',
    catalog: null,
    currentYear: null,
    appConfig: null,
    weights: null,
    maps: {
        main: null,
        compareVul: null,
        compareNut: null,
        evolutionBase: null,
        evolutionCompare: null,
    },
    layers: {
        main: null,
        compareVul: null,
        compareNut: null,
        evolutionBase: null,
        evolutionCompare: null,
    },
    legends: {
        main: null,
        compareVul: null,
        compareNut: null,
        evolutionBase: null,
        evolutionCompare: null,
    },
    compareMapsFitted: false,
    evolutionMapFitted: false,
    slimSelects: {
        compareVul: null,
        compareNut: null,
        evolutionMetric: null,
        evolutionCompareYear: null,
    },
    currentIndicator: 'Indice'
};
export const COLOMBIA_CENTER = [4.5709, -74.2973];
export const INITIAL_ZOOM = 6;

// --- DOM ELEMENTS ---
export const indicatorSelector = document.getElementById('indicator-selector');
export const storyBox = document.getElementById('story-box');
export const selectCompareVul = document.getElementById('select-compare-vul');
export const selectCompareNut = document.getElementById('select-compare-nut');
export const aboutBtn = document.getElementById('about-btn');
export const aboutModal = document.getElementById('about-modal');
export const closeModalBtn = document.querySelector('.close-button');
export const appFooter = document.querySelector('.app-footer');
export const tabs = {
    vulnerability: document.getElementById('tab-vulnerability'),
    compare: document.getElementById('tab-compare'),
    evolution: document.getElementById('tab-evolution'),
};
export const tabButtons = {
    vulnerability: document.getElementById('btn-tab-main'),
    compare: document.getElementById('btn-tab-compare'),
    evolution: document.getElementById('btn-tab-evolution'),
};
export const selectEvolutionMetric = document.getElementById('select-evolution-metric');
export const selectEvolutionCompareYear = document.getElementById('select-evolution-compare-year');
export const labelEvolutionBaseYear = document.getElementById('label-evolution-base-year');
export const labelEvMapBase = document.getElementById('label-ev-map-base');
export const labelEvMapCompare = document.getElementById('label-ev-map-compare');