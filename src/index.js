import { state } from './core/store.js';
import { initializeLegacyApp } from './bootstrap/legacy-app.js';
import { resetMapRuntime } from '../js/logica_mapa/mapa.js';

function waitForDomReady() {
    if (document.readyState === 'loading') {
        return new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }
    return Promise.resolve();
}

function getPrimaryDocument() {
    if (state.domRoot && state.domRoot.ownerDocument) {
        return state.domRoot.ownerDocument;
    }
    return document;
}

function createSafeStorage(winRef) {
    const win = winRef || window;
    return {
        getItem(key) {
            try {
                return win.localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        setItem(key, value) {
            try {
                win.localStorage.setItem(key, value);
            } catch (error) {
                // Ignore storage errors in restricted environments
            }
        },
        removeItem(key) {
            try {
                win.localStorage.removeItem(key);
            } catch (error) {
                // Ignore storage errors in restricted environments
            }
        }
    };
}

function getTabButton(tabKey) {
    const root = state.domRoot || getPrimaryDocument();
    if (tabKey === 'vulnerability') return root.querySelector('#btn-tab-main');
    if (tabKey === 'compare') return root.querySelector('#btn-tab-compare');
    if (tabKey === 'evolution') return root.querySelector('#btn-tab-evolution');
    return null;
}

function resolveContainer(container) {
    if (!container) return null;

    if (typeof container === 'string') {
        const mount = getPrimaryDocument().querySelector(container);
        if (!mount) {
            throw new Error(`Container not found: ${container}`);
        }
        return mount;
    }

    if (!(container instanceof HTMLElement)) {
        throw new Error('Container must be a selector string or HTMLElement.');
    }

    return container;
}

function getMountKey(targetContainer) {
    if (!targetContainer) return '__default__';
    if (targetContainer.id) return `#${targetContainer.id}`;
    return '__custom_element__';
}

function mountLegacyContainer(targetContainer) {
    const doc = targetContainer?.ownerDocument || getPrimaryDocument();
    const legacyRoot = doc.getElementById('ivai-legacy-root') || doc.getElementById('app-container');
    if (!legacyRoot) {
        throw new Error('Legacy root #ivai-legacy-root was not found.');
    }

    if (!targetContainer) {
        legacyRoot.classList.remove('ivai-external-mount');
        return legacyRoot;
    }

    if (targetContainer === legacyRoot || targetContainer.contains(legacyRoot)) {
        legacyRoot.classList.add('ivai-external-mount');
        return legacyRoot;
    }

    targetContainer.appendChild(legacyRoot);
    legacyRoot.classList.add('ivai-external-mount');

    return legacyRoot;
}

function resetAppState() {
    state.cleanupHandlers.forEach((cleanup) => {
        try {
            cleanup();
        } catch (error) {
            console.error('Error during IVAI cleanup handler:', error);
        }
    });
    state.cleanupHandlers = [];

    Object.values(state.maps).forEach((map) => {
        if (map && typeof map.remove === 'function') {
            map.remove();
        }
    });

    Object.keys(state.maps).forEach((key) => {
        state.maps[key] = null;
    });
    Object.keys(state.layers).forEach((key) => {
        state.layers[key] = null;
    });
    Object.keys(state.legends).forEach((key) => {
        state.legends[key] = null;
    });

    Object.keys(state.slimSelects).forEach((key) => {
        const instance = state.slimSelects[key];
        if (instance && typeof instance.destroy === 'function') {
            try {
                instance.destroy();
            } catch (error) {
                console.error(`Error destroying SlimSelect ${key}:`, error);
            }
        }
        state.slimSelects[key] = null;
    });

    state.compareMapsFitted = false;
    state.evolutionMapFitted = false;
    state.evolutionPendingUpdate = false;
    state.currentIndicator = 'Indice';

    state.indexData = {};
    state.nutritionData = {};
    state.geoData = null;
    state.indicatorData = {};
    state.indicatorConfig = {};
    state.catalog = null;
    state.currentYear = null;
    state.appConfig = null;
    state.weights = null;

    resetMapRuntime();

    state.appInitialized = false;
    state.domRoot = null;
    state.instanceMountKey = null;
    state.appOptions = {
        themeStorageKey: 'ivai-theme',
        storage: createSafeStorage(getPrimaryDocument().defaultView || window)
    };
}

function createAppApi() {
    return {
        async setYear(year) {
            const root = state.domRoot || getPrimaryDocument();
            const yearSelector = root.querySelector('#year-selector');
            if (!yearSelector) return;
            yearSelector.value = String(year);
            yearSelector.dispatchEvent(new Event('change', { bubbles: true }));
        },
        setTab(tabKey) {
            const tabButton = getTabButton(tabKey);
            if (tabButton) tabButton.click();
        },
        getState() {
            return state;
        },
        destroy() {
            resetAppState();
        }
    };
}

export async function createIvaiApp(container, options = {}) {
    await waitForDomReady();

    const resolvedContainer = resolveContainer(container);
    const mountKey = getMountKey(resolvedContainer);
    const defaultThemeStorageKey = `ivai-theme:${mountKey}`;
    const runtimeDoc = resolvedContainer?.ownerDocument || getPrimaryDocument();
    const runtimeStorage = options.storage || createSafeStorage(runtimeDoc.defaultView || window);

    state.appOptions = {
        themeStorageKey: options.themeStorageKey || defaultThemeStorageKey,
        storage: runtimeStorage
    };

    if (state.appInitialized) {
        if (state.instanceMountKey && state.instanceMountKey !== mountKey) {
            throw new Error('IVAI ya esta inicializado en otro contenedor. Actualmente solo se soporta una instancia por pagina.');
        }

        if (options.defaultTab) {
            const tabButton = getTabButton(options.defaultTab);
            if (tabButton) tabButton.click();
        }

        return createAppApi();
    }

    const mountedRoot = mountLegacyContainer(resolvedContainer);
    const primaryDoc = resolvedContainer?.ownerDocument || getPrimaryDocument();
    state.domRoot = mountedRoot || primaryDoc.getElementById('ivai-legacy-root') || primaryDoc;
    state.instanceMountKey = mountKey;

    await initializeLegacyApp();

    if (options.defaultTab) {
        const tabButton = getTabButton(options.defaultTab);
        if (tabButton) tabButton.click();
    }

    return createAppApi();
}
