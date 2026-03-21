import { state, indicatorSelector, selectCompareVul, selectCompareNut, appFooter, storyBox, aboutBtn, aboutModal, closeModalBtn, tabs, tabButtons } from './configuracion.js';
import { getIndicatorDisplayName } from './logica_mapa/ayudantes.js';
import { createMoreInfoPopup } from './logica_mapa/componentes.js';
import { updateMap, updateEvolutionMap } from './logica_mapa/mapa.js';
import { dim_icons, sub_icons } from './icons.js';
import {
    setupEvolutionMetricControl,
    setupEvolutionYearControl,
    updateEvolutionYearOptions as updateEvolutionYearOptionsModule,
    triggerEvolutionUpdate as triggerEvolutionUpdateModule,
    handleEvolutionTabActivated
} from '../src/tabs/evolution/ui-controller.js';

function getRoot() {
    return state.domRoot || document;
}

function getDoc() {
    const root = getRoot();
    return root.ownerDocument || document;
}

function getWin() {
    const doc = getDoc();
    return doc.defaultView || window;
}

function registerGlobalListener(target, eventName, handler, options) {
    if (!target || typeof target.addEventListener !== 'function') return;
    target.addEventListener(eventName, handler, options);
    state.cleanupHandlers.push(() => target.removeEventListener(eventName, handler, options));
}

function readTheme(themeStorageKey) {
    const storage = state.appOptions?.storage;
    if (storage && typeof storage.getItem === 'function') {
        return storage.getItem(themeStorageKey);
    }

    try {
        return localStorage.getItem(themeStorageKey);
    } catch (error) {
        return null;
    }
}

function writeTheme(themeStorageKey, value) {
    const storage = state.appOptions?.storage;
    if (storage && typeof storage.setItem === 'function') {
        storage.setItem(themeStorageKey, value);
        return;
    }

    try {
        localStorage.setItem(themeStorageKey, value);
    } catch (error) {
        // Ignore storage errors (private mode, restricted storage)
    }
}

function getById(id) {
    const root = getRoot();
    return root.querySelector ? root.querySelector(`#${id}`) : null;
}

function query(selector) {
    const root = getRoot();
    return root.querySelector ? root.querySelector(selector) : null;
}

function queryAll(selector) {
    const root = getRoot();
    return root.querySelectorAll ? root.querySelectorAll(selector) : [];
}

// --- UI POPULATION ---
export function populateControls() {
    const weightsMap = new Map(state.weights.Pesos_Dimensiones.map(d => [d.Dimension, d.Peso_Dimension]));
    const firstDeptKey = Object.keys(state.indexData)[0];
    if (!firstDeptKey) {
        console.error("No se encontró ningún departamento en indexData");
        return;
    }
    const firstDeptData = state.indexData[firstDeptKey];

    let indicators = Object.keys(firstDeptData).filter(key => key !== 'Ranking' && key !== 'Clasificacion_Indice');

    indicators.sort((a, b) => {
        if (a === 'Indice') return -1;
        if (b === 'Indice') return 1;
        return (weightsMap.get(b) || 0) - (weightsMap.get(a) || 0);
    });

    const indexSelector = getById('index-selector');
    let indexHtml = '';
    let dimensionsHtml = '';

    indicators.forEach((key, index) => {
        const weight = weightsMap.get(key);
        const weightLabel = weight ? `(${(weight * 100).toFixed(1)}%)` : '';
        const configKey = key === 'Indice' ? 'integrated' : key;
        const config = state.appConfig[configKey] || {};
        const displayName = config.nombreCompleto || key.replace(/_/g, ' ');
        const iconHTML = dim_icons[key] || '<i class="fa-solid fa-chart-simple"></i>';
        const finalLabel = key === 'Indice' ? displayName : `${displayName} ${weightLabel}`;
        if (key === 'Indice') {
            indexHtml = `
                <div class="accordion-group">
                    <div class="accordion-header">
                        <label style="display: flex; align-items: center; margin: 0; width: 100%; cursor: pointer;" title="${displayName}">
                            <input type="radio" name="indicator" value="${key}" style="display:none;" ${index === 0 ? 'checked' : ''}>
                            <span class="radio-icon">${iconHTML}</span>
                            <div class="accordion-title-wrapper">
                                <span class="accordion-title">${finalLabel}</span>
                            </div>
                        </label>
                        <div style="display:flex; align-items:center;">
                            <i class="fa-solid fa-chevron-down accordion-toggle-icon" style="visibility: hidden;"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // For dimensions, create an accordion group
            let subIndicatorsHtml = '';
            if (config.variables && config.variables.length > 0) {
                subIndicatorsHtml = config.variables.map(v => {
                    let valueForRadio = v.nombre;
                    const indicatorWeightLabel = v.peso ? `(${(v.peso * 100).toFixed(1)}%)` : '';

                    let parentColor = '';
                    const colorMatch = iconHTML.match(/style="color:\s*([^;]+);"/);
                    if (colorMatch && colorMatch[1]) {
                        parentColor = colorMatch[1];
                    }

                    const uniqueIconClass = sub_icons[v.nombre] || 'fa-solid fa-circle-dot';
                    const subIconHtml = `<i class="${uniqueIconClass}" style="color: ${parentColor};"></i>`;

                    return `
                        <div class="radio">
                            <label title="${v.nombre}">
                                <input type="radio" name="indicator" value="${valueForRadio}">
                                <span class="radio-span">
                                    <span class="radio-icon">${subIconHtml}</span>
                                    <span class="radio-label">${v.nombre} ${indicatorWeightLabel}</span>
                                </span>
                            </label>
                        </div>
                    `;
                }).join('');
            }

            dimensionsHtml += `
                <div class="accordion-group">
                    <div class="accordion-header">
                        <label style="display: flex; align-items: center; margin: 0; width: 100%; cursor: pointer;" title="${displayName}">
                            <input type="radio" name="indicator" value="${key}" style="display:none;" ${index === 0 ? 'checked' : ''}>
                            <span class="radio-icon">${iconHTML}</span>
                            <div class="accordion-title-wrapper">
                                <span class="accordion-title">${finalLabel}</span>
                            </div>
                        </label>
                        <div style="display:flex; align-items:center;">
                            <i class="fa-solid fa-chevron-down accordion-toggle-icon"></i>
                        </div>
                    </div>
                    <div class="accordion-content">
                        ${subIndicatorsHtml}
                    </div>
                </div>
            `;
        }
    });

    if (indexSelector) indexSelector.innerHTML = indexHtml;
    indicatorSelector.innerHTML = dimensionsHtml;

    // Configuración de acordeones removida (ahora usamos delegación de eventos centralizada)

    // Populate SlimSelect (Comparisons) with all indicators + subindicators
    let allSelectData = [];

    // Add Main Dimensions
    indicators.forEach(key => {
        allSelectData.push({
            value: key,
            text: getIndicatorDisplayName(key),
            html: `<b>${dim_icons[key] || ''} ${getIndicatorDisplayName(key)}</b>`
        });
    });

    if (state.slimSelects.compareVul) {
        state.slimSelects.compareVul.destroy();
    }
    selectCompareVul.innerHTML = ''; // Clear previous options
    state.slimSelects.compareVul = new SlimSelect({
        select: '#select-compare-vul',
        settings: {
            showSearch: false,
        },
        events: {
            afterChange: (newVal) => {
                if (newVal && newVal.length > 0) {
                    updateMap('compareVul', newVal[0].value);
                    closeLegendInfoModal();
                }
            }
        }
    });
    state.slimSelects.compareVul.setData(allSelectData);

    const nutIndicators = [
        ["ENSIN", "Desnutrición Crónica (ENSIN)"],
        ["Cronica", "Desnutrición Crónica (ICBF)"],
        ["R_Cronica", "Riesgo Desnutrición Crónica (ICBF)"],
        ["Aguda", "Desnutrición Aguda (ICBF)"],
        ["R_Aguda", "Riesgo Desnutrición Aguda (ICBF)"]
    ];
    const nutSelectData = nutIndicators.map(([key, name]) => ({
        value: key,
        text: name
    }));

    if (state.slimSelects.compareNut) {
        state.slimSelects.compareNut.destroy();
    }
    selectCompareNut.innerHTML = ''; // Clear previous options
    state.slimSelects.compareNut = new SlimSelect({
        select: '#select-compare-nut',
        settings: {
            showSearch: false,
        },
        events: {
            afterChange: (newVal) => {
                if (newVal && newVal.length > 0) {
                    updateMap('compareNut', newVal[0].value);
                    closeLegendInfoModal();
                }
            }
        }
    });
    state.slimSelects.compareNut.setData(nutSelectData);

    // Evolucion temporal: solo indice y dimensiones (sin indicadores nutricionales)
    const evolutionAllData = [...allSelectData];
    setupEvolutionMetricControl(evolutionAllData, triggerEvolutionUpdate);
    setupEvolutionYearControl(triggerEvolutionUpdate);
    updateEvolutionYearOptions();
}

export function updateEvolutionYearOptions() {
    updateEvolutionYearOptionsModule(triggerEvolutionUpdate);
}

export function triggerEvolutionUpdate() {
    triggerEvolutionUpdateModule(updateEvolutionMap);
}

export function populateFooter() {
    const year = state.currentYear || state.catalog?.defaultYear;
    appFooter.innerHTML = `Última actualización: Octubre ${year}`;
}

export function populateModal() {
    const modalYear = getById('modal-year');
    if (modalYear) {
        modalYear.textContent = state.currentYear || state.catalog?.defaultYear;
    }
    const modalSources = getById('modal-sources-content');
    if (modalSources) {
        let fuentes = state.catalog?.fuentes || '';
        if (state.currentYear) {
            fuentes = fuentes.replace(/ICBF \(202\d\)/g, `ICBF (${state.currentYear})`);
        }
        modalSources.textContent = fuentes;
    }
}

export function updateStoryBox(indicatorId) {
    const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
    const config = state.appConfig[configKey];

    // Fallback info for raw CSV indicators
    const fallbackName = indicatorId.replace(/_/g, ' ');
    const iconHTML = dim_icons[indicatorId] || '';

    if (!config) {
        // Buscar en la configuración de indicadores individuales
        const indConfig = state.indicatorConfig[indicatorId];
        if (indConfig) {
            // Buscar el ícono único del indicador y el color de su dimensión padre
            const uniqueIconClass = sub_icons[indicatorId] || 'fa-solid fa-circle-dot';
            let parentColor = '#666';
            // Recorrer appConfig para encontrar la dimensión padre que contiene este indicador
            for (const dimKey of Object.keys(state.appConfig)) {
                const dimConf = state.appConfig[dimKey];
                if (dimConf && dimConf.variables && dimConf.variables.some(v => v.nombre === indicatorId)) {
                    const parentIconHtml = dim_icons[dimKey] || '';
                    const colorMatch = parentIconHtml.match(/style="color:\s*([^;]+);"/);
                    if (colorMatch && colorMatch[1]) parentColor = colorMatch[1];
                    break;
                }
            }
            const indIconHTML = `<i class="${uniqueIconClass}" style="color: ${parentColor}; font-size: 1.5em; margin-right: 8px;"></i>`;

            storyBox.innerHTML = `
                ${indIconHTML}
                <h3>${indConfig.nombre_completo || fallbackName}</h3>
                ${indConfig.descripcion ? `<p>${indConfig.descripcion}</p>` : ''}
                ${indConfig.unidad_medida ? `<p class="indicator-unit"><strong>Unidad de medida:</strong> ${indConfig.unidad_medida}</p>` : ''}
            `;
        } else {
            storyBox.innerHTML = `
                ${iconHTML}
                <h3>${fallbackName}</h3>
                <p>Datos específicos obtenidos del archivo de indicadores ${state.currentYear || 2024}.</p>
            `;
        }
        return;
    }

    const evidenciasHtml = (config.evidencias && Array.isArray(config.evidencias)) ? config.evidencias.map(e =>
        `<a href="${e.url}" target="_blank" class="accion-btn">${e.nombre}</a>`
    ).join('') : '';

    const evidenciasTitle = 'Ruta de Acciones Sugeridas';

    storyBox.innerHTML = `
        ${iconHTML}
        <h3>${config.nombreCompleto || fallbackName}</h3>
        ${config.descripcion ? `<p>${config.descripcion}</p>` : ''}
        ${evidenciasHtml ? `<div class="section-title">${evidenciasTitle}:</div><div class="acciones-container">${evidenciasHtml}</div>` : ''}
    `;
}

export function setupTooltips() {
    const indicatorSelector = getById('indicator-selector');
    const sidebarContent = query('.sidebar-content');
    let tooltip = null;
    let hideTimeout = null;

    // Crear el elemento tooltip una sola vez
    tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    getDoc().body.appendChild(tooltip);
    state.cleanupHandlers.push(() => {
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
        tooltip = null;
    });

    const getDescription = (indicatorId) => {
        if (!indicatorId) return null;

        // Índice integrado
        const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
        const appConf = state.appConfig && state.appConfig[configKey];
        if (appConf && appConf.descripcion) {
            return {
                nombre: appConf.nombreCompleto || indicatorId,
                descripcion: appConf.descripcion,
                unidad: null,
                iconHTML: dim_icons[indicatorId] || ''
            };
        }

        // Indicador individual
        const indConf = state.indicatorConfig && state.indicatorConfig[indicatorId];
        if (indConf && indConf.descripcion) {
            // Buscar color de la dimensión padre
            const uniqueIconClass = sub_icons[indicatorId] || 'fa-solid fa-circle-dot';
            let parentColor = '#666';
            if (state.appConfig) {
                for (const dimKey of Object.keys(state.appConfig)) {
                    const dimConf = state.appConfig[dimKey];
                    if (dimConf && dimConf.variables && dimConf.variables.some(v => v.nombre === indicatorId)) {
                        const parentIconHtml = dim_icons[dimKey] || '';
                        const colorMatch = parentIconHtml.match(/style="color:\s*([^;]+);"/);
                        if (colorMatch && colorMatch[1]) parentColor = colorMatch[1];
                        break;
                    }
                }
            }
            return {
                nombre: indConf.nombre_completo || indicatorId,
                descripcion: indConf.descripcion,
                unidad: indConf.unidad_medida || null,
                iconHTML: `<i class="${uniqueIconClass}" style="color: ${parentColor};"></i>`
            };
        }

        return null;
    };

    const showTooltip = (indicatorId, targetEl) => {
        const info = getDescription(indicatorId);
        if (!info) return;

        tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-icon">${info.iconHTML}</span>
                <strong class="tooltip-title">${info.nombre}</strong>
            </div>
            <p class="tooltip-description">${info.descripcion}</p>
            ${info.unidad ? `<p class="tooltip-unit"><em>${info.unidad}</em></p>` : ''}
        `;

        tooltip.classList.add('visible');

        const rect = targetEl.getBoundingClientRect();
        const sidebarEl = query('.sidebar');
        const sidebarRect = sidebarEl.getBoundingClientRect();

        // Posicionar a la derecha del sidebar
        tooltip.style.top = `${Math.min(rect.top, window.innerHeight - tooltip.offsetHeight - 10)}px`;
        tooltip.style.left = `${sidebarRect.right + 12}px`;
    };

    const hideTooltip = () => {
        hideTimeout = setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 100);
    };

    const onSidebarMouseOver = (e) => {
        clearTimeout(hideTimeout);

        // Buscar el radio button más cercano para obtener su value (indicatorId)
        const radio = e.target.closest('label')?.querySelector('input[type="radio"]')
            || e.target.closest('.accordion-header')?.querySelector('input[type="radio"]');

        const targetEl = e.target.closest('label') || e.target.closest('.accordion-header');

        if (radio && targetEl) {
            showTooltip(radio.value, targetEl);
        }
    };

    const onSidebarMouseOut = (e) => {
        const stillInside = e.relatedTarget && sidebarContent.contains(e.relatedTarget);
        if (!stillInside) hideTooltip();
    };

    // Ocultar al hacer scroll
    const onSidebarScroll = () => {
        tooltip.classList.remove('visible');
    };

    registerGlobalListener(sidebarContent, 'mouseover', onSidebarMouseOver);
    registerGlobalListener(sidebarContent, 'mouseout', onSidebarMouseOut);
    registerGlobalListener(sidebarContent, 'scroll', onSidebarScroll);
}

export function setupSidebarToggle() {
    const toggleBtn = getById('toggle-sidebar-btn');
    const sidebar = query('.sidebar');
    if (!toggleBtn || !sidebar) return;

    const icon = toggleBtn.querySelector('i');

    const onToggleSidebarClick = () => {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
            toggleBtn.title = "Expandir menú";
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
            toggleBtn.title = "Colapsar menú";
        }
        // Invalidate map size after transition to prevent grey areas
        setTimeout(() => {
            state.maps.main.invalidateSize();
        }, 400); // Should match the CSS transition duration
    };

    registerGlobalListener(toggleBtn, 'click', onToggleSidebarClick);
}

// --- EVENT LISTENERS ---
export function setupEventListeners() {
    const sidebarContent = query('.sidebar-content');

    // Rastrear si la opción ya estaba seleccionada ANTES del click
    const onSidebarMouseDown = (e) => {
        const headerLabel = e.target.closest('.accordion-header label');
        if (headerLabel) {
            const radio = headerLabel.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                headerLabel.dataset.wasChecked = 'true';
            } else if (radio) {
                headerLabel.dataset.wasChecked = 'false';
            }
        }
    };

    const onSidebarChange = (e) => {
        if (e.target.name === 'indicator') {
            state.currentIndicator = e.target.value;

            // Si el radio seleccionado pertenece al header de un acordeón (dimensión),
            // abrir automáticamente ese acordeón y cerrar los demás. Hacerlo antes de las tareas pesadas.
            const parentGroup = e.target.closest('.accordion-group');
            if (parentGroup) {
                // Cerrar todos los demás acordeones
                queryAll('.accordion-group.open').forEach(openGroup => {
                    if (openGroup !== parentGroup) {
                        openGroup.classList.remove('open');
                        const content = openGroup.querySelector('.accordion-content');
                        if (content) content.style.maxHeight = null;
                    }
                });
                // Abrir el de la dimensión seleccionada si no está abierto ya
                if (!parentGroup.classList.contains('open')) {
                    parentGroup.classList.add('open');
                    const content = parentGroup.querySelector('.accordion-content');
                    if (content) {
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                }
            }

            // Tareas pesadas (redibujar mapa) se ejecutan con un mínimo retraso 
            // para que el navegador alcance a actualizar la vista primero (evitar visual freeze)
            setTimeout(() => {
                updateMap('main', e.target.value);
                updateStoryBox(e.target.value);
                closeLegendInfoModal();
            }, 10);
        }
    };

    registerGlobalListener(sidebarContent, 'mousedown', onSidebarMouseDown);
    registerGlobalListener(sidebarContent, 'change', onSidebarChange);

    const onSidebarClick = (e) => {
        // 1. Clic directo en el icono de la flechita (chevron)
        const toggleIcon = e.target.closest('.accordion-toggle-icon');
        if (toggleIcon) {
            e.stopPropagation();
            const group = toggleIcon.closest('.accordion-group');
            if (group) {
                const content = group.querySelector('.accordion-content');
                if (group.classList.contains('open')) {
                    group.classList.remove('open');
                    if (content) content.style.maxHeight = null;
                } else {
                    queryAll('.accordion-group.open').forEach(openGroup => {
                        openGroup.classList.remove('open');
                        const c = openGroup.querySelector('.accordion-content');
                        if (c) c.style.maxHeight = null;
                    });
                    group.classList.add('open');
                    if (content) content.style.maxHeight = content.scrollHeight + "px";
                }
            }
            return;
        }

        // 2. Clic en una dimensión (label) que YA ESTABA SELECCIONADA
        const headerLabel = e.target.closest('.accordion-header label');
        if (headerLabel && headerLabel.dataset.wasChecked === 'true') {
            const group = headerLabel.closest('.accordion-group');
            if (group) {
                const content = group.querySelector('.accordion-content');
                if (group.classList.contains('open')) {
                    // Si estaba abierto, colapsarlo
                    group.classList.remove('open');
                    if (content) content.style.maxHeight = null;
                } else {
                    // Si estaba cerrado, abrirlo y cerrar los demás
                    queryAll('.accordion-group.open').forEach(openGroup => {
                        if (openGroup !== group) {
                            openGroup.classList.remove('open');
                            const c = openGroup.querySelector('.accordion-content');
                            if (c) c.style.maxHeight = null;
                        }
                    });
                    group.classList.add('open');
                    if (content) content.style.maxHeight = content.scrollHeight + "px";
                }
                e.preventDefault(); // Prevenir comportamientos por defecto extraños al hacer clic repetido
            }
        }

        if (e.target.classList.contains('dimension-info-btn')) {
            const indicatorId = e.target.dataset.indicatorId;
            if (indicatorId) {
                const modal = getById('legend-info-modal');
                const modalBody = getById('legend-info-body');
                const modalTitle = getById('legend-info-title');

                const popupContent = createMoreInfoPopup(indicatorId);
                const displayName = getIndicatorDisplayName(indicatorId);

                modalTitle.innerHTML = `${dim_icons[indicatorId] || ''} ${displayName}`;
                modalBody.innerHTML = popupContent;
                modal.style.display = 'block';
            }
        }
    };
    registerGlobalListener(sidebarContent, 'click', onSidebarClick);



    registerGlobalListener(tabButtons.vulnerability, 'click', () => switchTab('vulnerability'));
    registerGlobalListener(tabButtons.compare, 'click', () => switchTab('compare'));
    if (tabButtons.evolution) registerGlobalListener(tabButtons.evolution, 'click', () => switchTab('evolution'));

    // Modal listeners
    registerGlobalListener(aboutBtn, 'click', () => {
        aboutModal.style.display = 'block';
    });
    // Use a more robust selector for the close button within the 'about' modal
    registerGlobalListener(aboutModal.querySelector('.close-button'), 'click', () => {
        aboutModal.style.display = 'none';
    });
    registerGlobalListener(aboutModal, 'click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    makeModalDraggable();
    makeLegendInfoModalDraggable();
}

function closeLegendInfoModal() {
    const modal = getById('legend-info-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function makeModalDraggable() {
    const modal = getById('about-modal');
    const modalContent = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    let isDragging = false;
    let offsetX, offsetY;

    const onModalHeaderMouseDown = (e) => {
        // Prevent dragging from starting on the close button
        if (e.target.classList.contains('close-button')) {
            return;
        }
        isDragging = true;

        // Calculate the offset from the top-left of the modal content
        offsetX = e.clientX - modalContent.offsetLeft;
        offsetY = e.clientY - modalContent.offsetTop;

        // Add a class to disable text selection and indicate dragging
        getDoc().body.style.userSelect = 'none';
    };
    registerGlobalListener(header, 'mousedown', onModalHeaderMouseDown);

    const onModalMouseMove = (e) => {
        if (!isDragging) return;

        // Calculate new position
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Boundary checks to keep the modal within the viewport
        const viewportWidth = getWin().innerWidth;
        const viewportHeight = getWin().innerHeight;
        const modalWidth = modalContent.offsetWidth;
        const modalHeight = modalContent.offsetHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - modalWidth));
        newY = Math.max(0, Math.min(newY, viewportHeight - modalHeight));

        modalContent.style.left = `${newX}px`;
        modalContent.style.top = `${newY}px`;
    };

    const onModalMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            // Re-enable text selection
            getDoc().body.style.userSelect = '';
        }
    };

    registerGlobalListener(getDoc(), 'mousemove', onModalMouseMove);
    registerGlobalListener(getDoc(), 'mouseup', onModalMouseUp);
}

export function makeLegendInfoModalDraggable() {
    const modal = getById('legend-info-modal');
    const modalContent = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    const closeBtn = getById('close-legend-info-modal');
    let isDragging = false;
    let offsetX, offsetY;

    const onLegendHeaderMouseDown = (e) => {
        if (e.target.classList.contains('close-button')) {
            return;
        }
        isDragging = true;

        // Ensure the modal content has a position style set
        if (!modalContent.style.left) modalContent.style.left = '50%';
        if (!modalContent.style.top) modalContent.style.top = '50%';


        offsetX = e.clientX - modalContent.getBoundingClientRect().left;
        offsetY = e.clientY - modalContent.getBoundingClientRect().top;

        getDoc().body.style.userSelect = 'none';
        modalContent.style.cursor = 'grabbing';
    };
    registerGlobalListener(header, 'mousedown', onLegendHeaderMouseDown);

    const onLegendMouseMove = (e) => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const viewportWidth = getWin().innerWidth;
        const viewportHeight = getWin().innerHeight;
        const modalWidth = modalContent.offsetWidth;
        const modalHeight = modalContent.offsetHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - modalWidth));
        newY = Math.max(0, Math.min(newY, viewportHeight - modalHeight));

        modalContent.style.left = `${newX}px`;
        modalContent.style.top = `${newY}px`;
        modalContent.style.transform = 'translate(0, 0)'; // Override transform
    };

    const onLegendMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            getDoc().body.style.userSelect = '';
            modalContent.style.cursor = 'grab';
        }
    };

    registerGlobalListener(getDoc(), 'mousemove', onLegendMouseMove);
    registerGlobalListener(getDoc(), 'mouseup', onLegendMouseUp);

    registerGlobalListener(closeBtn, 'click', () => {
        modal.style.display = 'none';
    });

    const onWindowClick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    registerGlobalListener(getWin(), 'click', onWindowClick);
}

function switchTab(tabKey) {
    closeLegendInfoModal();

    Object.values(tabs).forEach(tab => tab && tab.classList.remove('active'));
    Object.values(tabButtons).forEach(btn => btn && btn.classList.remove('active'));

    tabs[tabKey].classList.add('active');
    tabButtons[tabKey]?.classList.add('active');

    setTimeout(() => {
        Object.values(state.maps).forEach(map => map && map.invalidateSize());
        if (tabKey === 'compare' && !state.compareMapsFitted) {
            const mainlandGeoData = {
                ...state.geoData,
                features: state.geoData.features.filter(f => f.properties.DPTO_CCDGO !== '88')
            };
            const geoJsonLayer = L.geoJSON(mainlandGeoData);
            const bounds = geoJsonLayer.getBounds();

            state.maps.compareVul.fitBounds(bounds, { padding: [10, 10] });
            state.maps.compareNut.fitBounds(bounds, { padding: [10, 10] });

            state.maps.compareVul.sync(state.maps.compareNut);
            state.maps.compareNut.sync(state.maps.compareVul);

            state.compareMapsFitted = true;
        }
        if (tabKey === 'evolution') {
            handleEvolutionTabActivated(triggerEvolutionUpdate);
        }
    }, 150);
}

export function setupDarkMode(toggleMapCallback) {
    const btn = getById('dark-mode-btn');
    if (!btn) return;
    const icon = btn.querySelector('i');

    const themeStorageKey = state.appOptions?.themeStorageKey || 'ivai-theme';
    const isDark = readTheme(themeStorageKey) === 'dark';
    if (isDark) {
        getDoc().body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    const onDarkModeClick = () => {
        const currentlyDark = getDoc().body.classList.toggle('dark-mode');
        if (currentlyDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            writeTheme(themeStorageKey, 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            writeTheme(themeStorageKey, 'light');
        }
        if (toggleMapCallback) toggleMapCallback(currentlyDark);
    };
    registerGlobalListener(btn, 'click', onDarkModeClick);
}
