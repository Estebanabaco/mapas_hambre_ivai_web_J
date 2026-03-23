import { state } from './store.js';
import { setCurrentYear } from './actions.js';
import { getDomRegistry } from './dom-registry.js';

async function fetchJsonRequired(url, label) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`No se pudo cargar ${label || url} (HTTP ${response.status}).`);
    }
    return response.json();
}

async function fetchJsonOptional(url, label) {
    if (!url) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`No se pudo cargar ${label || url}. Se continúa sin este recurso.`, error);
        return null;
    }
}

function normalizeWeights(weights) {
    if (!weights || typeof weights !== 'object') {
        return {
            Pesos_Dimensiones: [],
            Pesos_Variables_Intra: []
        };
    }

    return {
        Pesos_Dimensiones: Array.isArray(weights.Pesos_Dimensiones) ? weights.Pesos_Dimensiones : [],
        Pesos_Variables_Intra: Array.isArray(weights.Pesos_Variables_Intra) ? weights.Pesos_Variables_Intra : []
    };
}

function applyIndexClassification(indexData) {
    for (const deptoCode in indexData) {
        const deptoData = indexData[deptoCode];
        const indice = deptoData.Indice;
        if (indice !== null && indice !== undefined) {
            let classification = 'Mínima';
            if (indice >= 65) {
                classification = 'Crítica';
            } else if (indice >= 50) {
                classification = 'Alta';
            } else if (indice >= 30) {
                classification = 'Media';
            } else if (indice >= 15) {
                classification = 'Baja';
            }
            deptoData.Clasificacion_Indice = classification;
        }
    }
}

export async function loadCatalog() {
    try {
        const catalogData = await fetch('config/metadatos.json').then(res => res.json());
        state.catalog = catalogData;

        const years = Array.isArray(catalogData.availableYears)
            ? catalogData.availableYears.map((year) => parseInt(year, 10)).filter((year) => Number.isFinite(year))
            : [];

        const latestYear = years.length ? Math.max(...years) : null;
        const selectedYear = latestYear ?? parseInt(catalogData.defaultYear, 10);

        if (Number.isFinite(selectedYear)) {
            setCurrentYear(selectedYear);
        }
    } catch (error) {
        console.error('Failed to load catalog:', error);
    }
}

export async function loadData() {
    try {
        const rutas = state.catalog.rutas[state.currentYear];
        const [geoData, indexData, nutritionData, indicatorData, appConfig, indicatorConfig] = await Promise.all([
            fetchJsonRequired('mapa/ColDepSNVlite.geojson', 'geojson de Colombia'),
            fetchJsonRequired(rutas.indexData, `datos de indice ${state.currentYear}`),
            fetchJsonRequired(rutas.nutritionData, `datos nutricionales ${state.currentYear}`),
            fetchJsonRequired(rutas.indicatorData, `datos de indicadores ${state.currentYear}`),
            fetchJsonRequired('config/configuracion_app.json', 'configuracion de la aplicacion'),
            fetchJsonRequired('config/config_indicadores.json', 'configuracion de indicadores')
        ]);

        const rawWeights = await fetchJsonOptional(rutas.weights, `pesos AHP ${state.currentYear}`);
        const weights = normalizeWeights(rawWeights);

        state.geoData = geoData;
        state.indexData = indexData;
        state.nutritionData = nutritionData;
        state.indicatorData = indicatorData || {};
        state.appConfig = appConfig;
        state.weights = weights;
        state.weightsAvailable = weights.Pesos_Dimensiones.length > 0;
        state.indicatorConfig = indicatorConfig || {};

        if (!state.weightsAvailable) {
            console.warn(`El año ${state.currentYear} no tiene pesos AHP disponibles. Se mostrará el visor sin ponderaciones AHP.`);
        }

        applyIndexClassification(state.indexData);
    } catch (error) {
        console.error('Failed to load data:', error);
        const { storyBox } = getDomRegistry();
        if (storyBox) {
            storyBox.innerHTML = '<p style="color: red;">Error: No se pudieron cargar los archivos de datos. Verifique la consola para mas detalles.</p>';
        }
    }
}

export async function loadYearData(year) {
    try {
        const rutas = state.catalog.rutas[year];
        if (!rutas) throw new Error('Rutas no encontradas para el año ' + year);

        const [indexData, nutritionData, indicatorData] = await Promise.all([
            fetchJsonRequired(rutas.indexData, `datos de indice ${year}`),
            fetchJsonRequired(rutas.nutritionData, `datos nutricionales ${year}`),
            fetchJsonRequired(rutas.indicatorData, `datos de indicadores ${year}`)
        ]);

        const rawWeights = await fetchJsonOptional(rutas.weights, `pesos AHP ${year}`);
        const weights = normalizeWeights(rawWeights);

        applyIndexClassification(indexData);

        return {
            indexData,
            nutritionData,
            indicatorData: indicatorData || {},
            weights,
            weightsAvailable: weights.Pesos_Dimensiones.length > 0
        };
    } catch (error) {
        console.error(`Failed to load data for year ${year}:`, error);
        return null;
    }
}
