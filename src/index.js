import { state } from './core/store.js';
import { initializeLegacyApp } from './bootstrap/legacy-app.js';

function waitForDomReady() {
    if (document.readyState === 'loading') {
        return new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }
    return Promise.resolve();
}

function getTabButton(tabKey) {
    const root = state.domRoot || document;
    if (tabKey === 'vulnerability') return root.querySelector('#btn-tab-main');
    if (tabKey === 'compare') return root.querySelector('#btn-tab-compare');
    if (tabKey === 'evolution') return root.querySelector('#btn-tab-evolution');
    return null;
}

function resolveContainer(container) {
    if (!container) return null;

    if (typeof container === 'string') {
        const mount = document.querySelector(container);
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
    const legacyRoot = document.getElementById('ivai-legacy-root') || document.getElementById('app-container');
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

export async function createIvaiApp(container, options = {}) {
    await waitForDomReady();

    const resolvedContainer = resolveContainer(container);
    const mountKey = getMountKey(resolvedContainer);

    if (state.appInitialized) {
        if (state.instanceMountKey && state.instanceMountKey !== mountKey) {
            throw new Error('IVAI ya esta inicializado en otro contenedor. Actualmente solo se soporta una instancia por pagina.');
        }

        if (options.defaultTab) {
            const tabButton = getTabButton(options.defaultTab);
            if (tabButton) tabButton.click();
        }

        return {
            async setYear(year) {
                const root = state.domRoot || document;
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

                state.appInitialized = false;
                state.domRoot = null;
                state.instanceMountKey = null;
            }
        };
    }

    const mountedRoot = mountLegacyContainer(resolvedContainer);
    state.domRoot = mountedRoot || document.getElementById('ivai-legacy-root') || document;
    state.instanceMountKey = mountKey;

    await initializeLegacyApp();

    if (options.defaultTab) {
        const tabButton = getTabButton(options.defaultTab);
        if (tabButton) tabButton.click();
    }

    return {
        async setYear(year) {
            const root = state.domRoot || document;
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

            state.appInitialized = false;
            state.domRoot = null;
            state.instanceMountKey = null;
        }
    };
}
