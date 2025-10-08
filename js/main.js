import { state, indicatorSelector, selectCompareVul, selectCompareNut } from './configuracion.js';
import { loadData } from './manejo_datos.js';
import { initMaps, updateMap } from './logica_mapa/mapa.js';
import { populateControls, populateFooter, setupEventListeners, setupSidebarToggle, setupTooltips, updateStoryBox } from './interfaz.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- MAIN EXECUTION ---
    async function main() {
        await loadData();
        if (state.geoData && state.indexData) {
            initMaps();

            const mainlandGeoData = {
                ...state.geoData,
                features: state.geoData.features.filter(f => f.properties.DPTO_CCDGO !== '88')
            };
            const geoJsonLayer = L.geoJSON(mainlandGeoData);
            const bounds = geoJsonLayer.getBounds();

            state.maps.main.fitBounds(bounds, { padding: [10, 10] });
            state.maps.main.invalidateSize();

            populateControls();
            populateFooter();
            setupEventListeners();
            setupSidebarToggle();
            setupTooltips();

            const initialIndicator = indicatorSelector.querySelector('input:checked');
            if (initialIndicator) {
                updateMap('main', initialIndicator.value);
                updateStoryBox(initialIndicator.value);
            }
            const selectedVul = state.slimSelects.compareVul.getSelected();
            if (selectedVul && selectedVul.length > 0) {
                updateMap('compareVul', selectedVul[0]);
            }
            if (selectCompareNut.value) {
                updateMap('compareNut', selectCompareNut.value);
            }
        }
    }

    main();
});
