document.addEventListener('DOMContentLoaded', () => {
    // --- STATE AND CONSTANTS ---
    const state = {
        geoData: null,
        indexData: null,
        nutritionData: null,
        appConfig: null,
        weights: null,
        maps: {
            main: null,
            compareVul: null,
            compareNut: null,
        },
        layers: {
            main: null,
            compareVul: null,
            compareNut: null,
        },
        legends: {
            main: null,
            compareVul: null,
            compareNut: null,
        },
        compareMapsFitted: false
    };
    const COLOMBIA_CENTER = [4.5709, -74.2973];
    const INITIAL_ZOOM = 6;

    // --- DOM ELEMENTS ---
    const indicatorSelector = document.getElementById('indicator-selector');
    const storyBox = document.getElementById('story-box');
    const selectCompareVul = document.getElementById('select-compare-vul');
    const selectCompareNut = document.getElementById('select-compare-nut');
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const appFooter = document.querySelector('.app-footer');
    const tabs = {
        vulnerability: document.getElementById('tab-vulnerability'),
        compare: document.getElementById('tab-compare'),
    };
    const tabButtons = {
        vulnerability: document.getElementById('btn-tab-main'),
        compare: document.getElementById('btn-tab-compare'),
    };

    // --- DATA FETCHING ---
    async function loadData() {
        try {
            const [geoData, indexData, nutritionData, appConfig, weights] = await Promise.all([
                fetch('mapa/ColDepSNVlite.geojson').then(res => res.json()),
                fetch('data/datos_indice.json').then(res => res.json()),
                fetch('data/datos_nutricionales.json').then(res => res.json()),
                fetch('data/configuracion_app.json').then(res => res.json()),
                fetch('data/002_Pesos_AHP_Hambre.json').then(res => res.json())
            ]);
            state.geoData = geoData;
            state.indexData = indexData;
            state.nutritionData = nutritionData;
            state.appConfig = appConfig;
            state.weights = weights;

            // Dynamically add Clasificacion_Indice based on Indice
            for (const deptoCode in state.indexData) {
                const deptoData = state.indexData[deptoCode];
                const indice = deptoData.Indice;
                if (indice !== null && indice !== undefined) {
                    let classification = 'Mínima'; // Default
                    if (indice >= 65) {
                        classification = 'Crítica';
                    } else if (indice >= 50) {
                        classification = 'Alta';
                    } else if (indice >= 30) {
                        classification = 'Media';
                    } else if (indice >= 15) {
                        classification = 'Baja';
                    }
                    deptoData.Clasificacion_Indice = classification;
                }
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            storyBox.innerHTML = `<p style="color: red;">Error: No se pudieron cargar los archivos de datos. Verifique la consola para más detalles.</p>`;
        }
    }

    // --- HELPERS ---
    function getIndicatorDisplayName(indicatorId) {
        const config = state.appConfig[indicatorId];
        return config?.nombreCompleto || indicatorId.replace(/_/g, ' ');
    }

    // --- MAP INITIALIZATION ---
    function initMaps() {
        const cartoLightUrl = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
        const cartoAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: cartoAttribution
        });

        const baseLayers = {
            "Claro": L.tileLayer(cartoLightUrl, { attribution: cartoAttribution }),
            "Estándar": osm,
            "Oscuro": cartoDark
        };

        // Initialize maps
        // Main map gets the layer control and its own instance of the light layer
        state.maps.main = L.map('map-main', {
            fullscreenControl: true,
            layers: [baseLayers.Claro] // Default layer
        });
        L.control.layers(baseLayers, null, { position: 'topright' }).addTo(state.maps.main);

        // Comparison maps get their own instances of the light basemap and no layer control
        state.maps.compareVul = L.map('map-compare-vul', {
            fullscreenControl: true,
            layers: [L.tileLayer(cartoLightUrl, { attribution: cartoAttribution })]
        });

        state.maps.compareNut = L.map('map-compare-nut', {
            fullscreenControl: true,
            layers: [L.tileLayer(cartoLightUrl, { attribution: cartoAttribution })]
        });
    }

    // --- UI POPULATION ---
    function populateControls() {
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
            const config = state.appConfig[key] || {};
            const displayName = config.nombreCompleto || key.replace(/_/g, ' ');
            const iconHTML = dim_icons[key] || '<i class="fa-solid fa-chart-simple"></i>';
            const finalLabel = key === 'Indice' ? 'Índice Integrado' : `${displayName} ${weightLabel}`;

            return `
                <div class="radio">
                  <label title="${displayName}">
                    <input type="radio" name="indicator" value="${key}" ${index === 0 ? 'checked' : ''}>
                     <span class="radio-span">
                        <span class="radio-icon">${iconHTML}</span>
                        <span class="radio-label">${finalLabel}</span>
                     </span>
                  </label>
                </div>
            `;
        }).join('');

        const unsortedIndicators = Object.keys(firstDeptData).filter(key => key !== 'Ranking' && key !== 'Clasificacion_Indice');
        selectCompareVul.innerHTML = unsortedIndicators.map(key => {
            const displayName = getIndicatorDisplayName(key);
            return `<option value="${key}">${displayName}</option>`;
        }).join('');

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

    function populateFooter() {
        const year = new Date().getFullYear();
        appFooter.innerHTML = `Desarrollado con R y Shiny | Última actualización: Octubre ${year}`;
    }

    // --- MAP DRAWING LOGIC ---
    // Helper functions for continuous color interpolation
    const lerp = (a, b, t) => a + (b - a) * t;
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    };
    const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).padStart(6, '0');

    function createColorPalette(values, isPercentage = false) {
        const domain = values.filter(v => v !== null && !isNaN(v));
        if (domain.length === 0) return () => '#d9d9d9';

        const min = Math.min(...domain);
        const max = Math.max(...domain);

        const colorStrings = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
        const colorRGBs = colorStrings.map(hexToRgb);
        const numColors = colorRGBs.length;

        return (value) => {
            if (value === null || isNaN(value)) return '#d9d9d9';

            const clampedValue = Math.max(min, Math.min(value, max));
            const t = (max - min) > 0 ? (clampedValue - min) / (max - min) : 0;

            const colorIndex = t * (numColors - 1);
            const i = Math.floor(colorIndex);
            const j = Math.min(i + 1, numColors - 1);
            const localT = colorIndex - i;

            const r = lerp(colorRGBs[i][0], colorRGBs[j][0], localT);
            const g = lerp(colorRGBs[i][1], colorRGBs[j][1], localT);
            const b = lerp(colorRGBs[i][2], colorRGBs[j][2], localT);

            return rgbToHex(r, g, b);
        };
    }

    function createLegend(map, palette, values, title, isPercentage = false) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend leaflet-legend');
            const domain = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);

            if (domain.length === 0) {
                div.innerHTML = `<h4>${title}</h4>No data`;
                return div;
            }

            const min = domain[0];
            const max = domain[domain.length - 1];

            const colors = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
            const gradient = `linear-gradient(to bottom, ${colors.join(', ')})`; // Light to dark, top to bottom
            const legendHeight = 180;

            const formatLabel = (value) => isPercentage ? `${(value * 100).toFixed(0)}%` : Math.round(value);

            // --- Generate labels with uniform spacing ---
            let labels = [];
            if (isPercentage) {
                const rangePercent = (max - min) * 100;
                let intervalPercent;
                if (rangePercent <= 5) {
                    intervalPercent = 1; // 1% steps
                } else if (rangePercent <= 10) {
                    intervalPercent = 2; // 2% steps
                } else if (rangePercent <= 25) {
                    intervalPercent = 5; // 5% steps
                } else {
                    intervalPercent = 10; // 10% steps
                }

                const startPercent = Math.ceil(min * 100 / intervalPercent) * intervalPercent;
                const endPercent = Math.floor(max * 100 / intervalPercent) * intervalPercent;

                for (let i = startPercent; i <= endPercent; i += intervalPercent) {
                    labels.push(i / 100);
                }
            } else {
                const interval = 10; // 10-unit steps for vulnerability maps
                const start = Math.ceil(min / interval) * interval;
                const end = Math.floor(max / interval) * interval;

                for (let i = start; i <= end; i += interval) {
                    labels.push(i);
                }
            }

            // If the range is too small to generate nice intervals, just show min and max.
            if (labels.length < 2) {
                labels = [min, max];
            }
            
            // Use unique sorted values
            labels = [...new Set(labels)].sort((a,b) => a - b);

            let labelsDivs = '';
            for (const val of labels) {
                const percentPosition = (max - min) > 0 ? (val - min) / (max - min) * 100 : 0;

                // Center all labels uniformly. This might cause slight clipping at the edges.
                const transform = 'translateY(-50%)';

                labelsDivs += `<div style="position: absolute; top: ${percentPosition}%; left: 0; width: 100%; transform: ${transform};">
                                 <span style="padding-left: 5px;">&ndash; ${formatLabel(val)}</span>
                               </div>`;
            }

            div.innerHTML = `
                <h4>${title}</h4>
                <div style="display: flex; align-items: stretch; height: ${legendHeight}px;">
                    <div style="width: 20px; background: ${gradient};"></div>
                    <div style="position: relative; width: 60px; font-size: 0.9em; margin-left: 5px;">
                        ${labelsDivs}
                    </div>
                </div>
            `;
            return div;
        };
        return legend;
    }

    function createIndiceLegend(map) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            // Create the new background div
            const backgroundDiv = L.DomUtil.create('div', 'legend-wrapper');
            backgroundDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // More transparent
            backgroundDiv.style.borderRadius = '8px'; // Slightly larger radius
            backgroundDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.25)'; // Broader, more diffuse shadow
            backgroundDiv.style.padding = '5px'; // Padding to make it larger than the foreground

            // Create the original legend div (foreground) and append it to the background
            const foregroundDiv = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded', backgroundDiv);
            
            // Styles for the original box
            foregroundDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
            foregroundDiv.style.padding = '8px';
            foregroundDiv.style.borderRadius = '5px';
            foregroundDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.2)'; // Keep original shadow for depth
            foregroundDiv.style.width = 'auto';
            foregroundDiv.style.minWidth = '350px';
            foregroundDiv.style.maxWidth = '90vw';

            const categories = [
                { label: "Mínima", range: "0-14", color: "#2E7D32" },
                { label: "Baja", range: "15-29", color: "#8BC34A" },
                { label: "Media", range: "30-49", color: "#F9A825" },
                { label: "Alta", range: "50-64", color: "#E64519" },
                { label: "Crítica", range: "65-100", color: "#B30000" }
            ];

            const titleHtml = `<h4 style='margin-top:0; margin-bottom:8px; font-size:0.95em; text-align:center; color: #333;'>Nivel de Vulnerabilidad</h4>`;
            const colorBarHtml = categories.map(c => `<div style='flex-grow: 1; background-color:${c.color}; height: 100%;'></div>`).join('');
            const labelsHtml = categories.map(c => `<div style='flex-grow: 1; text-align: center; font-size: 0.75em; line-height: 1.1; padding-top: 2px;'><div style='color: #333;'>${c.label}</div><div style='color: #555; font-size:0.9em;'>${c.range}</div></div>`).join('');

            foregroundDiv.innerHTML = `
                ${titleHtml}
                <div style='display: flex; width: 100%; height: 15px; margin-bottom: 3px; border: 1px solid #999;'>${colorBarHtml}</div>
                <div style='display: flex; width: 100%; justify-content: space-around;'>${labelsHtml}</div>
            `;
            
            // Stop propagation to prevent map clicks when interacting with the legend
            L.DomEvent.on(backgroundDiv, 'mousedown dblclick', L.DomEvent.stopPropagation);

            // Return the new wrapper
            return backgroundDiv;
        };
        return legend;
    }

    function createPopupContent(deptCode, deptName, indicatorId, mapKey) {
        const isNutritionMap = mapKey === 'compareNut';
        const data = isNutritionMap ? state.nutritionData : state.indexData;
        const deptData = data[deptCode];

        if (!deptData) return `<strong>${deptName}</strong><br>Datos no disponibles`;

        // Handle Vulnerability Maps (main and compareVul)
        if (!isNutritionMap) {
            const isIndice = indicatorId === 'Indice';
            if (isIndice) {
                const idxVal = deptData.Indice !== null ? deptData.Indice.toFixed(1) : "N/A";
                const rank = deptData.Ranking || "N/A";
                const classification = deptData.Clasificacion_Indice || "N/A";

                let tableHtml = `<br><table class="popup-table"><tr><th>Dimensión</th><th>Valor</th></tr>`;
                const dimensions = Object.keys(deptData).filter(k => k !== 'Indice' && k !== 'Ranking' && k !== 'Clasificacion_Indice');

                for (const dim of dimensions) {
                    const dimVal = deptData[dim] !== null ? deptData[dim].toFixed(1) : "N/A";
                    const dimName = getIndicatorDisplayName(dim);
                    const iconHTML = dim_icons[dim] || '';
                    tableHtml += `<tr><td>${iconHTML} ${dimName}</td><td>${dimVal}</td></tr>`;
                }
                tableHtml += `</table>`;

                return `<strong>${deptName}</strong><br><b>Índice Integrado:</b> ${idxVal} (${classification})<br><b>Ranking General:</b> ${rank}${tableHtml}`;
            } else {
                const value = deptData[indicatorId];
                const displayName = getIndicatorDisplayName(indicatorId);
                const formattedValue = (value !== null && !isNaN(value)) ? value.toFixed(2) : "No disponible";
                return `<strong>${deptName}</strong><br><b>${displayName}:</b> ${formattedValue}`;
            }
        }
        // Handle Nutrition Map (compareNut)
        else {
            const value = deptData[indicatorId];
            const displayName = selectCompareNut.options[selectCompareNut.selectedIndex].text;
            const formattedValue = (value !== null && !isNaN(value)) ? `${(value * 100).toFixed(1)}%` : "No disponible";
            return `<strong>${deptName}</strong><br><b>${displayName}:</b> ${formattedValue}`;
        }
    }

    function updateMap(mapKey, indicatorId) {
        const map = state.maps[mapKey];
        if (!map) return;

        if (state.layers[mapKey]) map.removeLayer(state.layers[mapKey]);
        if (state.legends[mapKey]) map.removeControl(state.legends[mapKey]);

        const isNutritionMap = mapKey === 'compareNut';
        const data = isNutritionMap ? state.nutritionData : state.indexData;
        
        let palette, legend;
        const isIndice = indicatorId === 'Indice';

        if (isIndice && mapKey === 'main') { 
            palette = (value) => {
                const classification = Object.values(state.indexData).find(d => d.Indice === value)?.Clasificacion_Indice;
                if (classification === 'Crítica') return '#B30000';
                if (classification === 'Alta') return '#E64519';
                if (classification === 'Media') return '#F9A825';
                if (classification === 'Baja') return '#8BC34A';
                if (classification === 'Mínima') return '#2E7D32';
                return '#d9d9d9';
            };
            legend = createIndiceLegend(map);
        } else {
            const legendTitle = isNutritionMap
                ? selectCompareNut.options[selectCompareNut.selectedIndex].text
                : getIndicatorDisplayName(indicatorId);
            const isPercentage = isNutritionMap;
            const values = Object.values(data).map(d => d[indicatorId]).filter(v => v != null);
            palette = createColorPalette(values, isPercentage);
            legend = createLegend(map, palette, values, legendTitle, isPercentage);
        }

        const geoJsonLayer = L.geoJSON(state.geoData, {
            style: (feature) => {
                const deptCode = parseInt(feature.properties.DPTO_CCDGO);
                const value = data[deptCode] ? data[deptCode][indicatorId] : null;
                return {
                    fillColor: palette(value),
                    weight: 0.8,
                    color: '#ffffff',
                    fillOpacity: 0.85
                };
            },
            onEachFeature: (feature, layer) => {
                const deptCode = parseInt(feature.properties.DPTO_CCDGO);
                let deptName = (feature.properties.DPTO_CNMBR || feature.properties.name || 'Nombre no disponible').trim().toLowerCase();
                // Convert to Title Case to match the original R app's str_to_title()
                deptName = deptName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                
                layer.bindTooltip(deptName);
                layer.bindPopup(() => createPopupContent(deptCode, deptName, indicatorId, mapKey));

                layer.on({
                    mouseover: (e) => {
                        e.target.setStyle({ weight: 2.5, color: '#2c3e50' });
                        e.target.bringToFront();
                    },
                    mouseout: (e) => geoJsonLayer.resetStyle(e.target),
                });
            }
        });
        
        geoJsonLayer.addTo(map);
        state.layers[mapKey] = geoJsonLayer;

        legend.addTo(map);
        state.legends[mapKey] = legend;
    }

    function updateStoryBox(indicatorId) {
        const config = state.appConfig[indicatorId];
        const iconHTML = dim_icons[indicatorId] || '';

        if (!config) {
            storyBox.innerHTML = `<p>No hay descripción disponible para este indicador.</p>`;
            return;
        }

        const variablesHtml = config.variables.map(v =>
            `<li>${v.nombre} ${v.peso ? `(${(v.peso * 100).toFixed(1)}%)` : ''}</li>`
        ).join('');

        const evidenciasHtml = config.evidencias.map(e =>
            `<li><a href="${e.url}" target="_blank">${e.nombre}</a></li>`
        ).join('');

        const evidenciasTitle = indicatorId === 'Indice' ? 'Leer Más' : 'Ruta de Acciones Sugeridas';

        storyBox.innerHTML = `
            ${iconHTML}
            <h3>${config.nombreCompleto}</h3>
            <p>${config.descripcion}</p>
            ${variablesHtml ? `<div class="section-title">${indicatorId === 'Indice' ? 'Dimensiones Incluidas (y sus pesos)' : 'Variables Incluidas'}:</div><ul>${variablesHtml}</ul>` : ''}
            ${evidenciasHtml ? `<div class="section-title">${evidenciasTitle}:</div><ul>${evidenciasHtml}</ul>` : ''}
        `;
    }

    function setupTooltips() {
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

    function setupSidebarToggle() {
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
    function setupEventListeners() {
        indicatorSelector.addEventListener('change', (e) => {
            if (e.target.name === 'indicator') {
                updateMap('main', e.target.value);
                updateStoryBox(e.target.value);
            }
        });

        selectCompareVul.addEventListener('change', (e) => updateMap('compareVul', e.target.value));
        selectCompareNut.addEventListener('change', (e) => updateMap('compareNut', e.target.value));

        tabButtons.vulnerability.addEventListener('click', () => switchTab('vulnerability'));
        tabButtons.compare.addEventListener('click', () => switchTab('compare'));

        // Modal listeners
        aboutBtn.addEventListener('click', () => aboutModal.style.display = 'block');
        closeModalBtn.addEventListener('click', () => aboutModal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target == aboutModal) {
                aboutModal.style.display = 'none';
            }
        });
    }
    
    function switchTab(tabKey) {
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

    // --- MAIN EXECUTION ---
    async function main() {
        await loadData();
        if (state.geoData && state.indexData) {
            initMaps();

            const mainlandGeoData = {
                ...state.geoData,
                features: state.geoData.features.filter(f => f.properties.DPTO_CCDGO !== '88')
            };
            const geoJsonLayer = L.geoJSON(mainlandGeoData);
            const bounds = geoJsonLayer.getBounds();

            state.maps.main.fitBounds(bounds, { padding: [10, 10] });
            state.maps.main.invalidateSize();

            populateControls();
            populateFooter();
            setupEventListeners();
            setupSidebarToggle();
            setupTooltips();

            const initialIndicator = indicatorSelector.querySelector('input:checked');
            if (initialIndicator) {
                updateMap('main', initialIndicator.value);
                updateStoryBox(initialIndicator.value);
            }
            if (selectCompareVul.value) {
                updateMap('compareVul', selectCompareVul.value);
            }
            if (selectCompareNut.value) {
                updateMap('compareNut', selectCompareNut.value);
            }
        }
    }

    main();
});