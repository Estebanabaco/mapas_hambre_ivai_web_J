import { state, selectCompareNut, refreshDomBindings } from '../../js/configuracion.js';
import { loadCatalog, loadData } from '../../js/manejo_datos.js';
import { initMaps, updateMap, toggleMapTheme } from '../../js/logica_mapa/mapa.js';
import {
    populateControls,
    populateFooter,
    setupEventListeners,
    setupSidebarToggle,
    setupTooltips,
    updateStoryBox,
    populateModal,
    setupDarkMode
} from '../../js/interfaz.js';
import { setCurrentYear } from '../core/actions.js';

function getRoot() {
    return state.domRoot || document;
}

function getById(id) {
    const root = getRoot();
    return root.querySelector ? root.querySelector(`#${id}`) : null;
}

function query(selector) {
    const root = getRoot();
    return root.querySelector ? root.querySelector(selector) : null;
}

export async function initializeLegacyApp() {
    if (state.appInitialized) return;
    try {
        refreshDomBindings(state.domRoot || document);

        await loadCatalog();

        const yearSelector = getById('year-selector');
        if (yearSelector && state.catalog) {
            yearSelector.innerHTML = state.catalog.availableYears.map(year =>
                `<option value="${year}" ${year === state.currentYear ? 'selected' : ''}>${year}</option>`
            ).join('');

            yearSelector.addEventListener('change', async (e) => {
                const newYear = parseInt(e.target.value, 10);
                if (newYear !== state.currentYear) {
                    setCurrentYear(newYear);
                    const mainMapEl = getById('map-main');
                    if (mainMapEl) mainMapEl.style.opacity = '0.5';

                    await loadData();

                    if (mainMapEl) mainMapEl.style.opacity = '1';

                    populateControls();
                    populateFooter();
                    populateModal();

                    const initialIndicator = query('input[name="indicator"]:checked');
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

            const initialIndicator = query('input[name="indicator"]:checked');
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

        state.appInitialized = true;
    } catch (error) {
        console.error('Critical error in main execution:', error);
    }
}
