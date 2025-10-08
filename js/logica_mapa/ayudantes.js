import { state } from '../configuracion.js';

export function getIndicatorDisplayName(indicatorId) {
    const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
    const config = state.appConfig[configKey];
    return config?.nombreCompleto || indicatorId.replace(/_/g, ' ');
}
