import { state } from '../configuracion.js';

export function getIndicatorDisplayName(indicatorId) {
    const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
    const config = state.appConfig[configKey];
    return config?.nombreCompleto || indicatorId.replace(/_/g, ' ');
}

// Nueva función para obtener flexiblemente un valor del JSON
export function getIndicatorValue(deptCode, indicatorId, customIndexData = null, customIndicatorData = null) {
    const iData = customIndexData || state.indexData;
    const indData = customIndicatorData || state.indicatorData;
    if (!deptCode || !iData[deptCode]) return null;
    
    // 1. Busca si está en la raíz principal (Índice o Dimensiones)
    if (iData[deptCode][indicatorId] !== undefined) {
        return iData[deptCode][indicatorId];
    }
    
    // 2. Si no, busca si es un Sub-indicador en el nuevo archivo independiente
    if (indData && indData[deptCode] && indData[deptCode][indicatorId] !== undefined) {
        return indData[deptCode][indicatorId];
    }
    
    return null;
}
