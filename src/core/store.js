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
    evolutionPendingUpdate: false,
    appInitialized: false,
    slimSelects: {
        compareVul: null,
        compareNut: null,
        evolutionMetric: null,
        evolutionCompareYear: null,
    },
};

export const COLOMBIA_CENTER = [4.5709, -74.2973];
export const INITIAL_ZOOM = 6;
