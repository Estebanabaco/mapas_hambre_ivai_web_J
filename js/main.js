import { state, indicatorSelector, selectCompareVul, selectCompareNut } from './configuracion.js';
import { loadCatalog, loadData } from './manejo_datos.js';
import { initMaps, updateMap, toggleMapTheme } from './logica_mapa/mapa.js';
import { populateControls, populateFooter, setupEventListeners, setupSidebarToggle, setupTooltips, updateStoryBox, populateModal, setupDarkMode } from './interfaz.js';
import { setCurrentYear } from '../src/core/actions.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- MAIN EXECUTION ---
    async function main() {
        try {
            await loadCatalog();
            
            const yearSelector = document.getElementById('year-selector');
            if (yearSelector && state.catalog) {
                yearSelector.innerHTML = state.catalog.availableYears.map(year => 
                    `<option value="${year}" ${year === state.currentYear ? 'selected' : ''}>${year}</option>`
                ).join('');
                
                yearSelector.addEventListener('change', async (e) => {
                    const newYear = parseInt(e.target.value);
                    if (newYear !== state.currentYear) {
                        setCurrentYear(newYear);
                        const mainMapEl = document.getElementById('map-main');
                        if (mainMapEl) mainMapEl.style.opacity = '0.5';
                        
                        await loadData();
                        
                        if (mainMapEl) mainMapEl.style.opacity = '1';
                        
                        populateControls();
                        populateFooter();
                        populateModal();
                        
                        const initialIndicator = document.querySelector('input[name="indicator"]:checked');
                        if (initialIndicator) {
                            updateMap('main', initialIndicator.value);
                            updateStoryBox(initialIndicator.value);
                        }
                        const selectedVul = state.slimSelects?.compareVul?.getSelected();
                        if (selectedVul && selectedVul.length > 0) {
                            updateMap('compareVul', selectedVul[0]);
                        }
                        const compareNutVal = selectCompareNut?.value;
                        if (compareNutVal) {
                            updateMap('compareNut', compareNutVal);
                        }
                    }
                });
            }

            await loadData();
            if (state.geoData && state.indexData) {
                initMaps();
                setupDarkMode(toggleMapTheme);

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
                populateModal();
                setupEventListeners();
                setupSidebarToggle();
                setupTooltips();

                const initialIndicator = document.querySelector('input[name="indicator"]:checked');
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
        } catch (error) {
            console.error("Critical error in main execution:", error);
        }
    }

    main();
});
