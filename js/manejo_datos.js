import { state, storyBox } from './configuracion.js';

// --- DATA FETCHING ---
export async function loadData() {
    try {
        const [geoData, indexData, nutritionData, appConfig, weights, siteConfig] = await Promise.all([
            fetch('mapa/ColDepSNVlite.geojson').then(res => res.json()),
            fetch('data/datos_indice.json').then(res => res.json()),
            fetch('data/datos_nutricionales.json').then(res => res.json()),
            fetch('data/configuracion_app.json').then(res => res.json()),
            fetch('data/002_Pesos_AHP_Hambre.json').then(res => res.json()),
            fetch('config/site_config.json').then(res => res.json())
        ]);
        state.geoData = geoData;
        state.indexData = indexData;
        state.nutritionData = nutritionData;
        state.appConfig = appConfig;
        state.weights = weights;
        state.siteConfig = siteConfig;

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
