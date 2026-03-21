import { state } from './store.js';
import { emit } from './events.js';

export function setCurrentYear(year) {
    state.currentYear = year;
    emit('year:changed', { year });
}

export function setCurrentIndicator(indicatorId) {
    state.currentIndicator = indicatorId;
    emit('indicator:changed', { indicatorId });
}

export function setEvolutionPendingUpdate(isPending) {
    state.evolutionPendingUpdate = isPending;
    emit('evolution:pending-changed', { isPending });
}
