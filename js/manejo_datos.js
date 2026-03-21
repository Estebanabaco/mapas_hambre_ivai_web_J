import { state, storyBox } from './configuracion.js';

// --- DATA FETCHING ---
export async function loadCatalog() {
    try {
        const catalogData = await fetch('config/metadatos.json').then(res => res.json());
        state.catalog = catalogData;
        state.currentYear = catalogData.defaultYear;
    } catch (error) {
        console.error("Failed to load catalog:", error);
    }
}

export async function loadData() {
    try {
        const rutas = state.catalog.rutas[state.currentYear];
        const [geoData, indexData, nutritionData, indicatorData, appConfig, weights, siteConfig, indicatorConfig] = await Promise.all([
            fetch('mapa/ColDepSNVlite.geojson').then(res => res.json()),
            fetch(rutas.indexData).then(res => res.json()),
            fetch(rutas.nutritionData).then(res => res.json()),
            fetch(rutas.indicatorData).then(res => res.json()),
            fetch('config/configuracion_app.json').then(res => res.json()),
            fetch(rutas.weights).then(res => res.json()),
            fetch('config/site_config.json').then(res => res.json()),
            fetch('config/config_indicadores.json').then(res => res.json())
        ]);
        state.geoData = geoData;
        state.indexData = indexData;
        state.nutritionData = nutritionData;
        state.indicatorData = indicatorData || {};
        state.appConfig = appConfig;
        state.weights = weights;
        state.siteConfig = siteConfig;
        state.indicatorConfig = indicatorConfig || {};

        // Dynamically add Clasificacion_Indice based on Indice
        for (const deptoCode in state.indexData) {
            const deptoData = state.indexData[deptoCode];
            const indice = deptoData.Indice;
            if (indice !== null && indice !== undefined) {
                let classification = 'Mínima'; // Default
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
    } catch (error) {
        console.error("Failed to load data:", error);
        storyBox.innerHTML = `<p style="color: red;">Error: No se pudieron cargar los archivos de datos. Verifique la consola para más detalles.</p>`;
    }
}

export async function loadYearData(year) {
    try {
        const rutas = state.catalog.rutas[year];
        if (!rutas) throw new Error("Rutas no encontradas para el año " + year);
        
        const [indexData, nutritionData, indicatorData, weights] = await Promise.all([
            fetch(rutas.indexData).then(res => res.json()),
            fetch(rutas.nutritionData).then(res => res.json()),
            fetch(rutas.indicatorData).then(res => res.json()),
            fetch(rutas.weights).then(res => res.json())
        ]);

        // Dynamically add Clasificacion_Indice based on Indice
        for (const deptoCode in indexData) {
            const deptoData = indexData[deptoCode];
            const indice = deptoData.Indice;
            if (indice !== null && indice !== undefined) {
                let classification = 'Mínima';
                if (indice >= 65) classification = 'Crítica';
                else if (indice >= 50) classification = 'Alta';
                else if (indice >= 30) classification = 'Media';
                else if (indice >= 15) classification = 'Baja';
                deptoData.Clasificacion_Indice = classification;
            }
        }

        return {
            indexData,
            nutritionData,
            indicatorData: indicatorData || {},
            weights
        };
    } catch (error) {
        console.error(`Failed to load data for year ${year}:`, error);
        return null;
    }
}
