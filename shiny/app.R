library(shiny)
library(leaflet)
library(sf)
library(readxl)
library(dplyr)
library(stringr)
library(scales)
library(shinyWidgets)
library(htmltools)
library(fontawesome)
library(leaflet.extras)

# --- 1. Carga y Preparación de Datos Iniciales --------------------------------
shp <- st_read("ColDepSNVlite.geojson", quiet = TRUE) |>
  st_transform(4326) |>
  mutate(code = as.integer(DPTO_CCDGO))

tryCatch({
  df_sub <- read_excel("003_Indice_Clasificado_por_Rangos.xlsx", sheet = "Indice_Clasificado_Rangos") |>
    mutate(code = as.integer(str_remove(CodigoD, "^D")))
}, error = function(e) {
  stop("Error: No se pudo cargar '003_Indice_Clasificado_por_Rangos.xlsx'. Asegúrate de que el script 003 haya generado este archivo. Detalles: ", e$message)
})

# Cargar datos de ICBF/ENSIN procesados por el script 004
tryCatch({
  df_icbf <- readRDS("004_icbf_procesado.rds")
}, error = function(e) {
  stop("Error: No se pudo cargar '004_icbf_procesado.rds'. Asegúrate de que el script 004.R se haya ejecutado correctamente. Detalles: ", e$message)
})


# Cargar pesos de las dimensiones
w_dims <- readRDS("002_Pesos_Inter_Dimensiones.rds")
dim_names <- names(w_dims)

# Nombres legibles y orden de las métricas
pretty_dim_names <- c(
  "Pobreza" = "Pobreza", "Desempleo_Ingresos" = "Desempleo e ingresos",
  "Salud_Nutricion" = "Salud y nutrición", "Inseguridad_Alimentaria" = "Inseguridad alimentaria",
  "Factores_Demograficos" = "Factores demográficos y sociales", "Acceso_Servicios" = "Acceso a servicios básicos",
  "Acceso_Grupos_Alimentos" = "Acceso a grupos de alimentos", "Indice" = "Índice Integrado"
)

ord <- order(w_dims, decreasing = TRUE) 

# Iconos para cada dimensión
dim_icons <- list(
  Indice = fa("layer-group", fill = "#0056b3"),
  Pobreza = fa("coins", fill = "#dc3545"),
  Desempleo_Ingresos = fa("briefcase", fill = "#fd7e14"),
  Salud_Nutricion = fa("heartbeat", fill = "#28a745"),
  Inseguridad_Alimentaria = fa("utensils", fill = "#6f42c1"),
  Factores_Demograficos = fa("users", fill = "#17a2b8"),
  Acceso_Servicios = fa("plug", fill = "#ffc107"),
  Acceso_Grupos_Alimentos = fa("shopping-basket", fill = "#e83e8c")
)

the_metrics <- c("Indice", dim_names[ord]) 

# Crear las opciones para los radioButtons con iconos y pesos
choices_html_metrics <- lapply(the_metrics, function(name) {
  label_text <- if (name == "Indice") {
    pretty_dim_names[["Indice"]]
  } else {
    paste0(pretty_dim_names[[name]], " (", scales::percent(w_dims[name], accuracy = 0.1), ")")
  }
  HTML(paste0("<span>", as.character(tags$span(style = "width: 25px; display: inline-block;", dim_icons[[name]])), label_text, "</span>"))
})

# Unir datos espaciales, de atributos del índice y de ICBF/ENSIN
mapa <- shp |>
  left_join(df_sub, by = "code") |>
  left_join(df_icbf, by = "code") |>
  mutate(Departamento = coalesce(Departamento, DPTO_CNMBR) |> str_to_title())

# --- 2. Carga de Datos desde Excel (para descripciones) ---------------------
excel_file <- "mapa_hambre_db.xlsx"

if (!file.exists(excel_file)) {
  stop("Error: El archivo 'mapa_hambre_db.xlsx' no se encontró. Por favor, créalo/actualízalo ejecutando el script 'crear_excel.R'.")
}

db_dimensiones <- read_excel(excel_file, sheet = "Dimensiones")
db_variables <- read_excel(excel_file, sheet = "Variables") 
db_evidencias <- read_excel(excel_file, sheet = "Evidencias")
db_dim_ev <- read_excel(excel_file, sheet = "Dimension_Evidencia")

# --- 3. UI ------------------------------------------------------------------
ui <- fluidPage(
  tags$head(
    tags$link(rel = "stylesheet", href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap"),
    tags$link(rel = "stylesheet", href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.fullscreen/1.0.2/Control.FullScreen.min.css"),
    tags$style(HTML("
      body { font-family: 'Roboto', sans-serif; background-color: #f8f9fa; color: #343a40; margin: 0; }
      h4 { color: #0056b3; font-weight: 700; margin-bottom: 15px; }
      .app-header { background-color: #ffffff; padding: 10px 20px; border-bottom: 1px solid #dee2e6; margin-bottom: 20px; text-align: center; font-size: 1.5em; font-weight: 300; color: #0056b3; }
      .app-footer { text-align: center; font-size: 0.8em; color: #6c757d; margin-top: 10px; padding: 10px; border-top: 1px solid #e9ecef;}
      .sidebar {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,.08);
        max-height: calc(85vh + 40px); 
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      .main-panel { padding-left: 20px; } 
      .story-box {
        background: #eef3f7; padding: 15px; border-radius: 8px; font-size: 0.85em;
        border-left: 5px solid #09ACAC; margin-top: 10px; margin-bottom: 15px; flex-shrink: 0;
      }
      .story-box .fa { display: block; margin-bottom: 8px; font-size: 1.3em; color: #0056b3; }
      .story-box h4 { margin-top: 0; margin-bottom: 8px; color: #0056b3; font-size: 1em; font-weight: 700; }
      .story-box p { margin-bottom: 8px; line-height: 1.5; }
      .story-box hr { margin-top: 10px; margin-bottom: 10px; border-top: 1px solid #cddde9; }
      .story-box h5 { margin-top: 10px; margin-bottom: 5px; font-weight: 700; color: #004085; font-size: 0.9em; }
      .story-box ul { list-style-type: none; padding-left: 0; margin-top: 5px; }
      .story-box li { margin-bottom: 4px; font-size: 0.9em; }
      .story-box li a { color: #0056b3; text-decoration: none; }
      .story-box li a:hover { text-decoration: underline; }
      .radio label { display: block; margin-bottom: 5px; font-size: 0.9em; transition: background-color 0.2s ease, color 0.2s ease; cursor: pointer; }
      .radio label > input[type='radio'] { display: none; }
      .radio label > span { display: flex; align-items: center; width: 100%; padding: 8px 12px; border-radius: 5px; border: 1px solid #e0e0e0; background-color: #fff; }
      .radio label:hover > span { background-color: #f0f5fa; border-color: #007bff; }
      .radio label > input[type='radio']:checked + span { background-color: #e9f5ff; border-left: 4px solid #0056b3; border-color: #0056b3; font-weight: 700; color: #004085; }
      .about-button { margin-top: auto; background-color: #6c757d; color: white; border: none; } 
      .about-button:hover { background-color: #5a6268; }
      .leaflet-container { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.08); }
      .sidebarLayout > .col-sm-4, .sidebarLayout > .col-sm-8 { height: calc(85vh + 40px + 20px); }
      .centered-select .selectize-input { text-align: center; height: 38px !important; }
      .centered-select .selectize-dropdown { text-align: left; z-index: 9999 !important; }
    "))
  ),
  tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.fullscreen/1.0.2/Control.FullScreen.min.js"),
  
  div(class = "app-header", ""),
  
  fluidRow(
    style = "padding-left: 15px; padding-right: 15px; margin-bottom: 10px;",
    sidebarLayout(
      sidebarPanel(
        div(class = "sidebar", 
            h4("Seleccione la Métrica de Vulnerabilidad"),
            radioButtons("dims_sel", NULL,
                         choiceNames = choices_html_metrics,
                         choiceValues = the_metrics,
                         selected = "Indice"), 
            uiOutput("story"), 
            hr(style="margin-top:15px; margin-bottom:15px;"),
            actionButton("about_btn", "Acerca de este Mapa", icon = icon("info-circle"), class = "about-button w-100 mt-auto")
        ),
        width = 4
      ),
      mainPanel(
        div(class = "main-panel", 
            tabsetPanel(
              id = "main_tabs",
              type = "tabs",
              tabPanel("Mapa de Vulnerabilidad", 
                       leafletOutput("mapa", height = "calc(85vh + 40px)")
              ),
              tabPanel("Mapas Comparativos", 
                       fluidRow(
                         column(6, uiOutput("compare_vul_title_ui")),
                         column(6, div(class = "centered-select", 
                                       selectInput("ensin_sel_compare",
                                                   label = tags$h5("Indicador Antropométrico", style="text-align:center; font-weight:bold;"),
                                                   choices = c("Desnutrición Crónica (ENSIN)" = "ENSIN",
                                                               "Desnutrición Crónica (ICBF)" = "Cronica",
                                                               "Riesgo de Desnutrición Crónica (ICBF)" = "R_Cronica",
                                                               "Desnutrición Aguda (ICBF)" = "Aguda",
                                                               "Riesgo de Desnutrición Aguda (ICBF)" = "R_Aguda"),
                                                   selected = "ENSIN",
                                                   width = "100%")))
                       ),
                       fluidRow(
                         column(6, leafletOutput("mapa_compare_vul", height = "calc(85vh - 80px)")),
                         column(6, leafletOutput("mapa_compare_ensin", height = "calc(85vh - 80px)"))
                       )
              )
            )
        ),
        width = 8
      )
    )
  ),
  div(class = "app-footer", paste("Desarrollado con R y Shiny | Última actualización:", format(Sys.Date(), "%B %Y")))
)

# --- 4. Server --------------------------------------------------------------
server <- function(input, output, session){
  
  mapa_r <- reactive({
    req(input$dims_sel) 
    sel_metric <- input$dims_sel 
    df_map <- mapa |>
      mutate(
        Indice_dyn = .data[[sel_metric]],
        Current_Selection_Metric = sel_metric
      )
    df_map
  })
  
  output$story <- renderUI({
    df <- mapa_r(); req(df)
    sel_metric <- df$Current_Selection_Metric[1]
    icon_html <- dim_icons[[sel_metric]]
    selected_name_for_story <- pretty_dim_names[[sel_metric]] 
    db_id_dim <- if (sel_metric == "Indice") "integrated" else sel_metric 
    descripcion_actual <- (db_dimensiones |> filter(id_dim == db_id_dim) |> pull(descripcion))[1]
    vars_df <- db_variables |> filter(id_dim == db_id_dim) 
    evid_ids <- db_dim_ev |> filter(id_dim == db_id_dim) |> pull(id_ev)
    evid_df <- db_evidencias |> filter(id_ev %in% evid_ids)
    if (is.na(descripcion_actual)) { descripcion_actual <- "Descripción no disponible." }
    vars_html <- ""
    if (sel_metric == "Indice") {
      dim_items <- lapply(names(w_dims), function(dim_n) { sprintf("<li>%s (%s)</li>", pretty_dim_names[[dim_n]], scales::percent(w_dims[dim_n], accuracy = 0.1)) })
      vars_html <- paste0("<h5>Dimensiones Incluidas (y sus pesos):</h5><ul>", paste(dim_items, collapse = ""), "</ul>")
    } else if (nrow(vars_df) > 0) {
      vars_items <- lapply(vars_df$nombre_variable, function(var) { sprintf("<li>%s</li>", var) })
      vars_html <- paste0("<h5>Variables Incluidas:</h5><ul>", paste(vars_items, collapse = ""), "</ul>")
    }
    evidence_html <- ""
    if (nrow(evid_df) > 0) {
      evidence_links <- mapply(function(name, url) { if (url == "#" || is.na(url) || url == "") sprintf("<li>%s</li>") else sprintf("<li><a href='%s' target='_blank'>%s</a></li>", url, name) }, evid_df$id_ev, evid_df$url_evidencia, SIMPLIFY = FALSE)
      evidence_title <- ifelse(sel_metric == "Indice", "Leer Más:", "Ruta de Acciones Sugeridas:")
      evidence_html <- paste0("<h5>", evidence_title, "</h5><ul>", paste(evidence_links, collapse = ""), "</ul>")
    }
    HTML(sprintf("<div class='story-box'>%s<h4>%s</h4><p>%s</p><hr>%s%s</div>", as.character(icon_html), selected_name_for_story, descripcion_actual, vars_html, evidence_html))
  })
  
  observeEvent(input$about_btn, {
    showModal(modalDialog(
      title = "Acerca de los Mapas del Hambre",
      HTML("
<p>Este tablero presenta, a nivel <strong>departamental</strong>, el índice de vulnerabilidad alimentaria infantil con corte <strong>2024</strong>. Un valor más alto indica mayor vulnerabilidad; el <strong>ranking 1</strong> corresponde al territorio más vulnerable.</p>

<p><strong>Cómo usar</strong></p>
<ul>
  <li>Seleccione el <strong>Índice Integrado</strong> o una de sus <strong>dimensiones</strong>; en el selector se muestra el <em>peso AHP</em> de cada dimensión.</li>
  <li>Al hacer clic sobre un departamento, se despliegan detalles y el desglose por dimensión.</li>
  <li>En la pestaña <strong>Mapas Comparativos</strong> se visualizan dos mapas lado a lado; los controles superiores permiten elegir la métrica de cada mapa para compararlos. El desplazamiento y el zoom están sincronizados.</li>
</ul>

<p><strong>Metodología (resumen)</strong></p>
<ul>
  <li>El índice se construye con <em>34 indicadores</em> agrupados en <em>7 dimensiones</em>.</li>
  <li>Se aplica normalización <em>min–max</em>, ponderación mediante <em>AHP</em> y agregación con <em>TOPSIS</em>; el resultado se reescala a 0–100.</li>
</ul>

<p><strong>Fuentes:</strong> DANE (GEIH, ECV, IPC, EEVV, Censo), INS–SIVIGILA, ENSIN (2015) & ICBF (2023)</em>.</p>
"),
      easyClose = TRUE,
      footer = modalButton("Cerrar")
    ))
  })
  
  
  # --- FUNCIÓN PARA CREAR POP-UPS ---
  create_popup_html <- function(df, i, sel_metric) {
    dept_name <- df$Departamento[i]
    idx_val_display <- if(!is.na(df$Indice[i])) sprintf("%.1f", df$Indice[i]) else "N/A"
    rank_general_display <- if(!is.na(df$Ranking[i])) df$Ranking[i] else "N/A"
    clasificacion_display <- if(!is.na(df$Clasificacion_Indice[i])) df$Clasificacion_Indice[i] else "N/A"
    
    popup_html_dim_specific <- ""
    if (sel_metric != "Indice") {
      dim_val_display <- if(!is.na(df[[sel_metric]][i])) sprintf("%.1f", df[[sel_metric]][i]) else "N/A"
      popup_html_dim_specific <- sprintf("<br><b>%s:</b> %s", pretty_dim_names[[sel_metric]], dim_val_display)
    }
    
    dims_popup_table_html <- ""
    if (sel_metric == "Indice") {
      dims_popup_table_html <- "<br><table style='width:100%;border-collapse:collapse;margin-top:5px;'><tr><th style='border-bottom:1px solid #ccc;text-align:left'>Dimensión</th><th style='border-bottom:1px solid #ccc;text-align:right'>Valor</th></tr>" 
      for (dim_name_loop in dim_names) {
        val_col_loop <- dim_name_loop 
        dim_val_table_display <- if(!is.na(df[[val_col_loop]][i])) sprintf("%.1f", df[[val_col_loop]][i]) else "N/A"
        dims_popup_table_html <- paste0(dims_popup_table_html, sprintf("<tr><td>%s %s</td><td style='text-align:right;'>%s</td></tr>", as.character(dim_icons[[dim_name_loop]]), pretty_dim_names[[dim_name_loop]], dim_val_table_display))
      }
      dims_popup_table_html <- paste0(dims_popup_table_html, "</table>")
    }
    
    if (sel_metric == "Indice") {
      HTML(sprintf("<strong>%s</strong><br><b>Índice Integrado:</b> %s (%s)<br><b>Ranking General:</b> %s%s", dept_name, idx_val_display, clasificacion_display, rank_general_display, dims_popup_table_html))
    } else { 
      HTML(sprintf("<strong>%s</strong>%s", dept_name, popup_html_dim_specific))
    }
  }
  
  # --- MAPA 1: VULNERABILIDAD (PESTAÑA PRINCIPAL) ---
  output$mapa <- renderLeaflet({
    mapa_mainland <- mapa |> filter(code != 88) 
    bbox <- if(nrow(mapa_mainland) > 0) as.vector(st_bbox(mapa_mainland)) else c(-79, -4, -67, 12) 
    leaflet(mapa) |>
      addProviderTiles(providers$CartoDB.Positron, group = "Claro") |>
      addProviderTiles(providers$OpenStreetMap.Mapnik, group = "Estándar") |>
      addProviderTiles(providers$CartoDB.DarkMatter, group = "Oscuro") |>
      fitBounds(lng1 = bbox[1], lat1 = bbox[2], lng2 = bbox[3], lat2 = bbox[4], options = list(padding = c(10, 10))) |>
      addLayersControl(baseGroups = c("Claro", "Estándar", "Oscuro"), options = layersControlOptions(collapsed = TRUE), position = "topright") |>
      addFullscreenControl(pseudoFullscreen = TRUE) 
  })
  
  observe({
    df <- mapa_r(); req(df)
    current_basemap_group <- input$mapa_groups
    proxy <- leafletProxy("mapa", data = df) |> clearShapes() |> clearControls() 
    sel_metric <- df$Current_Selection_Metric[1]
    
    if (sel_metric == "Indice") {
      req(df$Clasificacion_Indice)
      pal_factor_polygons <- colorFactor(palette = c("#B30000", "#E64519", "#F9A825", "#8BC34A", "#2E7D32"), levels = c("Crítica", "Alta", "Media", "Baja", "Mínima"), ordered = TRUE, na.color = "#d9d9d9")
      fill_values_formula <- ~pal_factor_polygons(Clasificacion_Indice)
      
      category_labels_legend_order <- c("Mínima", "Baja", "Media", "Alta", "Crítica")
      palette_colors_legend_order <- c("#2E7D32", "#8BC34A", "#F9A825", "#E64519", "#B30000") 
      category_ranges_text_legend <- c("0-14", "15-29", "30-49", "50-64", "65-100")
      is_dark_theme <- !is.null(current_basemap_group) && "Oscuro" %in% current_basemap_group
      legend_bg_color <- if(is_dark_theme) "rgba(45, 45, 45, 0.88)" else "rgba(255,255,255,0.9)"
      legend_title_color <- if(is_dark_theme) "#f0f0f0" else "#333"
      legend_label_color <- if(is_dark_theme) "#e0e0e0" else "#333"
      legend_range_color <- if(is_dark_theme) "#cccccc" else "#555"
      legend_bar_border_color <- if(is_dark_theme) "#666" else "#999"
      color_bar_segments_html <- mapply(function(color) { sprintf("<div style='flex-grow: 1; background-color:%s; height: 100%%;'></div>", color) }, palette_colors_legend_order, SIMPLIFY = FALSE)
      text_labels_html <- mapply(function(label, range_text) { sprintf("<div style='flex-grow: 1; text-align: center; font-size: 0.75em; line-height: 1.1; padding-top: 2px;'><div style='color: %s;'>%s</div><div style='color: %s; font-size:0.9em;'>%s</div></div>", legend_label_color, label, legend_range_color, range_text) }, category_labels_legend_order, category_ranges_text_legend, SIMPLIFY = FALSE)
      legend_control_html <- paste0(sprintf("<div class='leaflet-control-layers leaflet-control-layers-expanded' style='background-color: %s; padding: 8px; border-radius: 5px; box-shadow: 0 1px 5px rgba(0,0,0,0.2); width: auto; min-width: 350px; max-width: 90vw;'>", legend_bg_color), sprintf("<h4 style='margin-top:0; margin-bottom:8px; font-size:0.95em; text-align:center; color: %s;'>Nivel de Vulnerabilidad</h4>", legend_title_color), sprintf("<div style='display: flex; width: 100%%; height: 15px; margin-bottom: 3px; border: 1px solid %s;'>", legend_bar_border_color), paste(color_bar_segments_html, collapse = ""), "</div>", "<div style='display: flex; width: 100%; justify-content: space-around;'>", paste(text_labels_html, collapse = ""), "</div>", "</div>")
      proxy |> addControl(html = HTML(legend_control_html), position = "bottomright", layerId = "mapLegendCustomHorizontalBar")
      
    } else { 
      pal_numeric <- colorNumeric(c("#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"), domain = df$Indice_dyn, na.color = "#d9d9d9")
      fill_values_formula <- ~pal_numeric(Indice_dyn)
      proxy |> addLegend("bottomright", pal = pal_numeric, values = ~Indice_dyn, title = HTML(pretty_dim_names[[sel_metric]]), labFormat = labelFormat(digits = 1), opacity = 1, layerId = "mapLegendNumeric")
    }
    
    proxy |> addPolygons(layerId = ~code, fillColor = fill_values_formula, weight = 0.8, color = "#ffffff", fillOpacity = 0.85, opacity = 1, label = ~Departamento, popup = ~lapply(1:nrow(df), create_popup_html, df = df, sel_metric = sel_metric), highlightOptions = highlightOptions(color = "#2c3e50", weight = 2.5, bringToFront = TRUE))
  })
  
  # --- MAPAS COMPARATIVOS (SINCRONIZACIÓN MANUAL) ---
  
  output$compare_vul_title_ui <- renderUI({
    req(input$dims_sel)
    selected_metric_name <- pretty_dim_names[[input$dims_sel]]
    div(
      h5("Métrica de Vulnerabilidad", style="text-align:left; font-weight:bold; margin-bottom: 9px;"),
      div(style = "padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff; text-align: center; font-size: 14px; height: 38px; line-height: 24px; box-shadow: inset 0 1px 1px rgba(0,0,0,.075);",
          selected_metric_name
      )
    )
  })
  
  # Mapa base izquierdo (Vulnerabilidad)
  output$mapa_compare_vul <- renderLeaflet({
    leaflet(mapa, options = leafletOptions(zoomControl = FALSE)) |>
      addProviderTiles(providers$CartoDB.Positron) |>
      fitBounds(lng1 = -79, lat1 = -4, lng2 = -67, lat2 = 12) |>
      addFullscreenControl()
  })
  
  # Mapa base derecho (ENSIN)
  output$mapa_compare_ensin <- renderLeaflet({
    leaflet(mapa, options = leafletOptions(zoomControl = FALSE)) |>
      addProviderTiles(providers$CartoDB.Positron) |>
      fitBounds(lng1 = -79, lat1 = -4, lng2 = -67, lat2 = 12) |>
      addFullscreenControl()
  })
  
  # Actualizar mapa izquierdo (Vulnerabilidad)
  observeEvent(list(input$main_tabs, input$dims_sel), {
    if (input$main_tabs == "Mapas Comparativos") {
      sel_metric_compare <- input$dims_sel
      df_compare <- mapa |> mutate(Indice_dyn = .data[[sel_metric_compare]])
      
      proxy <- leafletProxy("mapa_compare_vul", data = df_compare) |> clearShapes() |> clearControls()
      
      pal <- colorNumeric(c("#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"), domain = df_compare$Indice_dyn, na.color = "#d9d9d9")
      proxy |> addPolygons(fillColor = ~pal(Indice_dyn), weight = 0.8, color = "#ffffff", fillOpacity = 0.85, label = ~Departamento, popup = ~lapply(1:nrow(df_compare), create_popup_html, df = df_compare, sel_metric = sel_metric_compare))
      proxy |> addLegend("bottomright", pal = pal, values = ~Indice_dyn, title = HTML(pretty_dim_names[[sel_metric_compare]]), labFormat = labelFormat(digits = 1), opacity = 1)
    }
  })
  
  # Actualizar mapa derecho (ENSIN)
  observeEvent(list(input$main_tabs, input$ensin_sel_compare), {
    if (input$main_tabs == "Mapas Comparativos") {
      sel_indicador_compare <- input$ensin_sel_compare
      df_ensin_compare <- mapa |> mutate(valor_indicador = .data[[sel_indicador_compare]])
      
      proxy <- leafletProxy("mapa_compare_ensin", data = df_ensin_compare) |> clearShapes() |> clearControls()
      
      pretty_ensin_names <- c(
        "ENSIN" = "Desnutrición Crónica (ENSIN)",
        "Cronica" = "Desnutrición Crónica (ICBF)",
        "R_Cronica" = "Riesgo de Desnutrición Crónica (ICBF)",
        "Aguda" = "Desnutrición Aguda (ICBF)",
        "R_Aguda" = "Riesgo de Desnutrición Aguda (ICBF)"
      )
      legend_title_ensin <- pretty_ensin_names[sel_indicador_compare]
      
      pal_ensin <- colorNumeric(c("#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"), domain = df_ensin_compare$valor_indicador, na.color = "#d9d9d9")
      proxy |> addPolygons(fillColor = ~pal_ensin(valor_indicador), weight = 0.8, color = "#ffffff", fillOpacity = 0.85, label = ~Departamento, popup = ~paste0("<strong>", Departamento, "</strong><br>", legend_title_ensin, ": ", scales::percent(valor_indicador, accuracy = 0.1)))
      proxy |> addLegend("bottomright", pal = pal_ensin, values = ~valor_indicador, title = HTML(legend_title_ensin), labFormat = labelFormat(suffix = "%", transform = function(x) 100 * x), opacity = 1)
    }
  })
  
  # Sincronización manual de los mapas
  observe({
    req(input$mapa_compare_vul_zoom, input$mapa_compare_vul_center)
    leafletProxy("mapa_compare_ensin") |>
      setView(lng = input$mapa_compare_vul_center$lng, lat = input$mapa_compare_vul_center$lat, zoom = input$mapa_compare_vul_zoom)
  })
  
  observe({
    req(input$mapa_compare_ensin_zoom, input$mapa_compare_ensin_center)
    leafletProxy("mapa_compare_vul") |>
      setView(lng = input$mapa_compare_ensin_center$lng, lat = input$mapa_compare_ensin_center$lat, zoom = input$mapa_compare_ensin_zoom)
  })
}

# Ejecutar la aplicación
shinyApp(ui, server)
