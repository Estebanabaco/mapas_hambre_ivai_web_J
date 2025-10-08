// --- STATE AND CONSTANTS ---
export const state = {
    geoData: null,
    indexData: null,
    nutritionData: null,
    appConfig: null,
    weights: null,
    maps: {
        main: null,
        compareVul: null,
        compareNut: null,
    },
    layers: {
        main: null,
        compareVul: null,
        compareNut: null,
    },
    legends: {
        main: null,
        compareVul: null,
        compareNut: null,
    },
    compareMapsFitted: false
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
};
export const tabButtons = {
    vulnerability: document.getElementById('btn-tab-main'),
    compare: document.getElementById('btn-tab-compare'),
};
