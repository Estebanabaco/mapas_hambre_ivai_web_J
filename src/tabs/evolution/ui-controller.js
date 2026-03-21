import { state } from '../../core/store.js';
import { setEvolutionPendingUpdate } from '../../core/actions.js';

export function setupEvolutionMetricControl(evolutionOptions, onTriggerUpdate) {
    if (state.slimSelects.evolutionMetric) state.slimSelects.evolutionMetric.destroy();
    const selectEvolutionMetric = document.getElementById('select-evolution-metric');
    if (!selectEvolutionMetric) return;

    selectEvolutionMetric.innerHTML = '';
    state.slimSelects.evolutionMetric = new SlimSelect({
        select: '#select-evolution-metric',
        settings: { showSearch: false },
        events: {
            afterChange: () => onTriggerUpdate()
        }
    });
    state.slimSelects.evolutionMetric.setData(evolutionOptions);
}

export function setupEvolutionYearControl(onTriggerUpdate) {
    if (state.slimSelects.evolutionCompareYear) state.slimSelects.evolutionCompareYear.destroy();
    const selectEvolutionCompareYear = document.getElementById('select-evolution-compare-year');
    if (!selectEvolutionCompareYear || !state.catalog) return;

    selectEvolutionCompareYear.innerHTML = '';
    state.slimSelects.evolutionCompareYear = new SlimSelect({
        select: '#select-evolution-compare-year',
        settings: { showSearch: false },
        events: {
            afterChange: () => onTriggerUpdate()
        }
    });
}

export function updateEvolutionYearOptions(onTriggerUpdate) {
    if (!state.slimSelects.evolutionCompareYear || !state.catalog) return;
    const available = state.catalog.availableYears.filter(y => y !== state.currentYear);
    const options = available.map(y => ({ value: String(y), text: String(y) }));
    state.slimSelects.evolutionCompareYear.setData(options);

    const labelEvolutionBaseYear = document.getElementById('label-evolution-base-year');
    if (labelEvolutionBaseYear) labelEvolutionBaseYear.textContent = state.currentYear;

    setEvolutionPendingUpdate(true);
    const evTab = document.getElementById('tab-evolution');
    if (evTab && evTab.classList.contains('active')) {
        onTriggerUpdate();
    }
}

export function triggerEvolutionUpdate(updateEvolutionMap) {
    if (!state.slimSelects.evolutionMetric || !state.slimSelects.evolutionCompareYear) return;

    const evTab = document.getElementById('tab-evolution');
    if (!evTab || !evTab.classList.contains('active')) {
        setEvolutionPendingUpdate(true);
        return;
    }

    const metricSelected = state.slimSelects.evolutionMetric.getSelected();
    const yearSelected = state.slimSelects.evolutionCompareYear.getSelected();

    if (metricSelected && metricSelected.length > 0 && yearSelected && yearSelected.length > 0) {
        const metric = metricSelected[0];
        const compareYear = parseInt(yearSelected[0], 10);
        setEvolutionPendingUpdate(false);
        updateEvolutionMap(metric, state.currentYear, compareYear);

        const lblBase = document.getElementById('label-ev-map-base');
        const lblComp = document.getElementById('label-ev-map-compare');
        if (lblBase) lblBase.textContent = state.currentYear;
        if (lblComp) lblComp.textContent = compareYear;
    }
}

export function handleEvolutionTabActivated(triggerUpdate) {
    state.maps.evolutionBase && state.maps.evolutionBase.invalidateSize();
    state.maps.evolutionCompare && state.maps.evolutionCompare.invalidateSize();

    if (state.evolutionPendingUpdate || !state.evolutionMapFitted) {
        state.evolutionMapFitted = false;
        triggerUpdate();
    }
}
