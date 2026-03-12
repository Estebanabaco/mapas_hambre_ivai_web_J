import { state } from '../configuracion.js';

export function getIndicatorDisplayName(indicatorId) {
    const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
    const config = state.appConfig[configKey];
    return config?.nombreCompleto || indicatorId.replace(/_/g, ' ');
}

// Nueva función para obtener flexiblemente un valor del JSON
export function getIndicatorValue(deptCode, indicatorId) {
    if (!deptCode || !state.indexData[deptCode]) return null;
    
    // 1. Busca si está en la raíz principal (Índice o Dimensiones)
    if (state.indexData[deptCode][indicatorId] !== undefined) {
        return state.indexData[deptCode][indicatorId];
    }
    
    // 2. Si no, busca si es un Sub-indicador en el nuevo archivo independiente
    if (state.subIndicatorData && state.subIndicatorData[deptCode] && state.subIndicatorData[deptCode][indicatorId] !== undefined) {
        return state.subIndicatorData[deptCode][indicatorId];
    }
    
    return null;
}
