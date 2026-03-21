import { state } from './core/store.js';
import { initializeLegacyApp } from '../js/main.js';

function getTabButton(tabKey) {
    if (tabKey === 'vulnerability') return document.getElementById('btn-tab-main');
    if (tabKey === 'compare') return document.getElementById('btn-tab-compare');
    if (tabKey === 'evolution') return document.getElementById('btn-tab-evolution');
    return null;
}

export async function createIvaiApp(container, options = {}) {
    if (container && typeof container === 'string') {
        const mount = document.querySelector(container);
        if (!mount) {
            throw new Error(`Container not found: ${container}`);
        }
    } else if (container && !(container instanceof HTMLElement)) {
        throw new Error('Container must be a selector string or HTMLElement.');
    }

    await initializeLegacyApp();

    if (options.defaultTab) {
        const tabButton = getTabButton(options.defaultTab);
        if (tabButton) tabButton.click();
    }

    return {
        async setYear(year) {
            const yearSelector = document.getElementById('year-selector');
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
            state.appInitialized = false;
        }
    };
}
