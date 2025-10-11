import { state, indicatorSelector, selectCompareVul, selectCompareNut, appFooter, storyBox, aboutBtn, aboutModal, closeModalBtn, tabs, tabButtons } from './configuracion.js';
import { getIndicatorDisplayName } from './logica_mapa/ayudantes.js';
import { createMoreInfoPopup } from './logica_mapa/componentes.js';
import { updateMap } from './logica_mapa/mapa.js';
import { dim_icons } from './icons.js';

// --- UI POPULATION ---
export function populateControls() {
    const weightsMap = new Map(state.weights.Pesos_Dimensiones.map(d => [d.Dimension, d.Peso_Dimension]));
    const firstDeptKey = Object.keys(state.indexData)[0];
    if (!firstDeptKey) return;
    const firstDeptData = state.indexData[firstDeptKey];
    
    let indicators = Object.keys(firstDeptData).filter(key => key !== 'Ranking' && key !== 'Clasificacion_Indice');
    
    indicators.sort((a, b) => {
        if (a === 'Indice') return -1;
        if (b === 'Indice') return 1;
        return (weightsMap.get(b) || 0) - (weightsMap.get(a) || 0);
    });

    indicatorSelector.innerHTML = indicators.map((key, index) => {
        const weight = weightsMap.get(key);
        const weightLabel = weight ? `(${(weight * 100).toFixed(1)}%)` : '';
        const configKey = key === 'Indice' ? 'integrated' : key;
        const config = state.appConfig[configKey] || {};
        const displayName = config.nombreCompleto || key.replace(/_/g, ' ');
        const iconHTML = dim_icons[key] || '<i class="fa-solid fa-chart-simple"></i>';
        const finalLabel = key === 'Indice' ? 'Índice Integrado' : `${displayName} ${weightLabel}`;

        const infoIconHtml = `<i class="fas fa-info-circle dimension-info-btn" data-indicator-id="${key}" title="Más información sobre ${displayName}"></i>`;

        return `
            <div class="radio">
              <label title="${displayName}">
                <input type="radio" name="indicator" value="${key}" ${index === 0 ? 'checked' : ''}>
                 <span class="radio-span">
                    <span class="radio-icon">${iconHTML}</span>
                    <span class="radio-label">${finalLabel}</span>
                 </span>
              </label>
              ${infoIconHtml}
            </div>
        `;
    }).join('');

    const unsortedIndicators = Object.keys(firstDeptData).filter(key => key !== 'Ranking' && key !== 'Clasificacion_Indice');
    const selectData = unsortedIndicators.map(key => {
        const displayName = getIndicatorDisplayName(key);
        const iconHTML = dim_icons[key] || '<i class="fa-solid fa-chart-simple"></i>';
        return {
            value: key,
            text: displayName, // for searching
            html: `${iconHTML}&nbsp;&nbsp;${displayName}`
        };
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
    state.slimSelects.compareVul.setData(selectData);

    const nutIndicators = [
        ["ENSIN", "Desnutrición Crónica (ENSIN)"],
        ["Cronica", "Desnutrición Crónica (ICBF)"],
        ["R_Cronica", "Riesgo Desnutrición Crónica (ICBF)"],
        ["Aguda", "Desnutrición Aguda (ICBF)"],
        ["R_Aguda", "Riesgo Desnutrición Aguda (ICBF)"]
    ];
    selectCompareNut.innerHTML = nutIndicators.map(([key, name]) =>
        `<option value="${key}">${name}</option>`
    ).join('');
}

export function populateFooter() {
    const year = state.siteConfig.year;
    appFooter.innerHTML = `Última actualización: Octubre ${year}`;
}

export function populateModal() {
    const modalYear = document.getElementById('modal-year');
    if (modalYear) {
        modalYear.textContent = state.siteConfig.year;
    }
}

export function updateStoryBox(indicatorId) {
    const configKey = indicatorId === 'Indice' ? 'integrated' : indicatorId;
    const config = state.appConfig[configKey];
    const iconHTML = dim_icons[indicatorId] || '';

    if (!config) {
        storyBox.innerHTML = `<p>No hay descripción disponible para este indicador.</p>`;
        return;
    }

    const evidenciasHtml = config.evidencias.map(e =>
        `<a href="${e.url}" target="_blank" class="accion-btn">${e.nombre}</a>`
    ).join('');

    const evidenciasTitle = 'Ruta de Acciones Sugeridas';

    storyBox.innerHTML = `
        ${iconHTML}
        <h3>${config.nombreCompleto}</h3>
        ${evidenciasHtml ? `<div class="section-title">${evidenciasTitle}:</div><div class="acciones-container">${evidenciasHtml}</div>` : ''}
    `;
}

export function setupTooltips() {
    const indicatorSelector = document.getElementById('indicator-selector');
    const sidebar = document.querySelector('.sidebar');
    let tooltip = null;

    indicatorSelector.addEventListener('mouseover', (e) => {
        const label = e.target.closest('label');
        if (!label || !sidebar.classList.contains('collapsed')) {
            return;
        }

        const title = label.getAttribute('title');
        if (!title) return;

        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = title;
        tooltip.classList.add('visible');

        const labelRect = label.getBoundingClientRect();
        
        // Position tooltip
        tooltip.style.top = `${labelRect.top + (labelRect.height / 2) - (tooltip.offsetHeight / 2)}px`;
        tooltip.style.left = `${labelRect.right + 10}px`; // 10px to the right
    });

    indicatorSelector.addEventListener('mouseout', (e) => {
        const label = e.target.closest('label');
        if (label && tooltip) {
            tooltip.classList.remove('visible');
        }
    });

    // Hide tooltip on scroll within the sidebar to prevent it from being orphaned
    const sidebarContent = document.querySelector('.sidebar-content');
    sidebarContent.addEventListener('scroll', () => {
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    });
}

export function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.querySelector('.sidebar');
    if (!toggleBtn || !sidebar) return;

    const icon = toggleBtn.querySelector('i');

    toggleBtn.addEventListener('click', () => {
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
    });
}

// --- EVENT LISTENERS ---
export function setupEventListeners() {
    indicatorSelector.addEventListener('change', (e) => {
        if (e.target.name === 'indicator') {
            state.currentIndicator = e.target.value;
            updateMap('main', e.target.value);
            updateStoryBox(e.target.value);
            closeLegendInfoModal();
        }
    });

    indicatorSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('dimension-info-btn')) {
            const indicatorId = e.target.dataset.indicatorId;
            if (indicatorId) {
                const modal = document.getElementById('legend-info-modal');
                const modalBody = document.getElementById('legend-info-body');
                const modalTitle = document.getElementById('legend-info-title');

                const popupContent = createMoreInfoPopup(indicatorId);
                const displayName = getIndicatorDisplayName(indicatorId);

                modalTitle.innerHTML = `${dim_icons[indicatorId] || ''} ${displayName}`;
                modalBody.innerHTML = popupContent;
                modal.style.display = 'block';
            }
        }
    });

    selectCompareNut.addEventListener('change', (e) => {
        updateMap('compareNut', e.target.value);
        closeLegendInfoModal();
    });

    tabButtons.vulnerability.addEventListener('click', () => switchTab('vulnerability'));
    tabButtons.compare.addEventListener('click', () => switchTab('compare'));

    // Modal listeners
    aboutBtn.addEventListener('click', () => {
        aboutModal.style.display = 'block';
    });
    // Use a more robust selector for the close button within the 'about' modal
    aboutModal.querySelector('.close-button').addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });
    aboutModal.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    makeModalDraggable();
    makeLegendInfoModalDraggable();
}

function closeLegendInfoModal() {
    const modal = document.getElementById('legend-info-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function makeModalDraggable() {
    const modal = document.getElementById('about-modal');
    const modalContent = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        // Prevent dragging from starting on the close button
        if (e.target.classList.contains('close-button')) {
            return;
        }
        isDragging = true;

        // Calculate the offset from the top-left of the modal content
        offsetX = e.clientX - modalContent.offsetLeft;
        offsetY = e.clientY - modalContent.offsetTop;

        // Add a class to disable text selection and indicate dragging
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Calculate new position
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Boundary checks to keep the modal within the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = modalContent.offsetWidth;
        const modalHeight = modalContent.offsetHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - modalWidth));
        newY = Math.max(0, Math.min(newY, viewportHeight - modalHeight));

        modalContent.style.left = `${newX}px`;
        modalContent.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            // Re-enable text selection
            document.body.style.userSelect = '';
        }
    });
}

export function makeLegendInfoModalDraggable() {
    const modal = document.getElementById('legend-info-modal');
    const modalContent = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    const closeBtn = document.getElementById('close-legend-info-modal');
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('close-button')) {
            return;
        }
        isDragging = true;

        // Ensure the modal content has a position style set
        if (!modalContent.style.left) modalContent.style.left = '50%';
        if (!modalContent.style.top) modalContent.style.top = '50%';


        offsetX = e.clientX - modalContent.getBoundingClientRect().left;
        offsetY = e.clientY - modalContent.getBoundingClientRect().top;

        document.body.style.userSelect = 'none';
        modalContent.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = modalContent.offsetWidth;
        const modalHeight = modalContent.offsetHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - modalWidth));
        newY = Math.max(0, Math.min(newY, viewportHeight - modalHeight));

        modalContent.style.left = `${newX}px`;
        modalContent.style.top = `${newY}px`;
        modalContent.style.transform = 'translate(0, 0)'; // Override transform
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            modalContent.style.cursor = 'grab';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function switchTab(tabKey) {
    closeLegendInfoModal();

    Object.values(tabs).forEach(tab => tab.classList.remove('active'));
    Object.values(tabButtons).forEach(btn => btn.classList.remove('active'));
    
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
    }, 100);
}