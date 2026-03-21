const IVAI_TYPES = {
  indice: { sheet: 'indice', mode: 'dept' },
  indicadores: { sheet: 'indicadores', mode: 'dept' },
  nutricionales: { sheet: 'nutricionales', mode: 'dept' },
  ahp: { sheet: 'ahp_dimensiones', mode: 'ahp' }
};

const DATA_FILES = {
  indice: 'datos_indice.json',
  indicadores: 'datos_indicadores.json',
  nutricionales: 'datos_nutricionales.json',
  ahp: '002_Pesos_AHP_Hambre.json'
};

const DEFAULTS = {
  BASE_URL: 'https://tu-dominio.com/ivai2024',
  YEAR: '2024'
};

const DATA_DICTIONARY_SHEET = 'diccionario_datos';

const DATA_DICTIONARY_HEADERS = [
  'grupo',
  'hoja',
  'variable_sheet',
  'variable_json',
  'nombre_mostrado',
  'descripcion',
  'unidad'
];

const SHEET_HEADERS = {
  indice: [
    'dept_code',
    'Indice',
    'Ranking',
    'Clasificacion_Indice',
    'Pobreza',
    'Desempleo_Ingresos',
    'Salud_Nutricion',
    'Inseguridad_Alimentaria',
    'Factores_Demograficos',
    'Acceso_Servicios',
    'Acceso_Grupos_Alimentos'
  ],
  indicadores: [
    'dept_code',
    'gini',
    'desmp',
    'ipc_alim',
    'ctrl_pren',
    'mrt_mtna',
    'morb_desn_agd_u5',
    'morb_eda_u5',
    'mrt_desn_agd_u5',
    'mrt_eda_u5',
    'desn_cron_u5',
    'bpn',
    'is_mod_grv',
    'is_grv',
    'hgr_12m',
    'prom_hgr',
    'tf_10_14',
    'tf_15_19',
    'etnica',
    'hog_acued',
    'hog_alcant',
    'hog_aseo',
    'hog_energia',
    'hog_carnes',
    'hog_huevos',
    'hog_lact',
    'hog_frutas',
    'hog_verd',
    'hog_cer',
    'hog_granos',
    'hog_tuberc',
    'pob_monet',
    'pob_ext',
    'pob_subjetiva',
    'pob_multi'
  ],
  nutricionales: [
    'dept_code',
    'ENSIN',
    'Cronica',
    'R_Cronica',
    'Aguda',
    'R_Aguda'
  ],
  ahp_dimensiones: [
    'Dimension',
    'Peso_Dimension'
  ],
  ahp_indicadores: [
    'Dimension',
    'Variable',
    'Peso_Variable',
    'CR'
  ]
};

const INDICADORES_JSON_TO_SHEET = {
  'Pobreza monetaria extrema': 'pob_ext',
  'Pobreza multidimensional': 'pob_multi',
  'Pobreza subjetiva': 'pob_subjetiva',
  'Pobreza monetaria': 'pob_monet',
  'Coeficiente de GINI': 'gini',
  'Tasa de desempleo': 'desmp',
  'IPC alimentos y bebidas': 'ipc_alim',
  'Mortalidad desnutrición aguda < 5 años': 'mrt_desn_agd_u5',
  'Mortalidad EDA < 5 años': 'mrt_eda_u5',
  'Morbilidad desnutrición aguda < 5 años': 'morb_desn_agd_u5',
  'Morbilidad EDA < 5 años': 'morb_eda_u5',
  'Bajo peso al nacer': 'bpn',
  'Controles prenatales': 'ctrl_pren',
  'Mortalidad materna': 'mrt_mtna',
  'Desnutrición crónica < 5 años': 'desn_cron_u5',
  'Inseguridad alimentaria grave': 'is_grv',
  'Inseguridad alimentaria moderada/grave': 'is_mod_grv',
  'Población étnica': 'etnica',
  'Hogares jefa mujer (c/hijos < 18 años)': 'hgr_12m',
  'Promedio personas por hogar': 'prom_hgr',
  'Tasa fecundidad (10-14 años)': 'tf_10_14',
  'Tasa fecundidad (15-19 años)': 'tf_15_19',
  'Acceso acueducto': 'hog_acued',
  'Acceso alcantarillado': 'hog_alcant',
  'Acceso aseo': 'hog_aseo',
  'Acceso energía eléctrica': 'hog_energia',
  'Adquieren carne/pollo/pescado': 'hog_carnes',
  'Adquieren huevos': 'hog_huevos',
  'Adquieren lácteos': 'hog_lact',
  'Adquieren frutas': 'hog_frutas',
  'Adquieren verduras': 'hog_verd',
  'Adquieren cereales': 'hog_cer',
  'Adquieren granos': 'hog_granos',
  'Adquieren tubérculos/plátanos': 'hog_tuberc'
};

const INDICADORES_SHEET_TO_JSON = (function buildIndicadoresInverseMap_(source) {
  const inverse = {};
  Object.keys(source).forEach(function (jsonKey) {
    inverse[source[jsonKey]] = jsonKey;
  });
  return inverse;
})(INDICADORES_JSON_TO_SHEET);
