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
  API_BASE_URL: 'http://localhost/ivai2024/api/update.php',
  YEAR: '2024'
};

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
    'prnbi',
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
  ahp_variables_intra: [
    'Dimension',
    'Variable',
    'Peso_Variable',
    'CR'
  ]
};
