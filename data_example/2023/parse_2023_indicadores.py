import csv
import json
import os

def clean_number(value_str):
    if not value_str or value_str.strip() == '':
        return None
        
    value_str = value_str.replace('%', '').strip()
    
    if ',' in value_str and '.' not in value_str:
        value_str = value_str.replace(',', '.')
    elif ',' in value_str and '.' in value_str:
        value_str = value_str.replace('.', '').replace(',', '.')
        
    try:
        return float(value_str)
    except ValueError:
        return None

mapping_vars = {
    'pob_mon_ext': 'Pobreza monetaria extrema',
    'pob_multi': 'Pobreza multidimensional',
    'Pob_Subj': 'Pobreza subjetiva',
    'pob_mon': 'Pobreza monetaria',
    'gini': 'Coeficiente de GINI',
    'desmp': 'Tasa de desempleo',
    'ipc_alim': 'IPC alimentos y bebidas',
    'mort_dnt': 'Mortalidad desnutrición aguda < 5 años',
    'mort_eda': 'Mortalidad EDA < 5 años',
    'morb_dnt': 'Morbilidad desnutrición aguda < 5 años',
    'morb_eda': 'Morbilidad EDA < 5 años',
    'bajo_peso': 'Bajo peso al nacer',
    'cont_pren': 'Controles prenatales',
    'mort_gest': 'Mortalidad materna',
    'dnt_cro': 'Desnutrición crónica < 5 años',
    'inseg_alim_grav': 'Inseguridad alimentaria grave',
    'inseg_alim_mod': 'Inseguridad alimentaria moderada/grave',
    'Porcentaje_Etnica': 'Población étnica',
    'hog_jefa_mujer': 'Hogares jefa mujer (c/hijos < 18 años)',
    'prom_hogar': 'Promedio personas por hogar',
    'fec_14': 'Tasa fecundidad (10-14 años)',
    'fec_19': 'Tasa fecundidad (15-19 años)',
    'hog_acued': 'Acceso acueducto',
    'hog_alcant': 'Acceso alcantarillado',
    'hog_aseo': 'Acceso aseo',
    'hog_energia': 'Acceso energía eléctrica',
    'hog_carnes': 'Adquieren carne/pollo/pescado',
    'hog_huevos': 'Adquieren huevos',
    'hog_lact': 'Adquieren lácteos',
    'hog_frutas': 'Adquieren frutas',
    'hog_verd': 'Adquieren verduras',
    'hog_cer': 'Adquieren cereales',
    'hog_granos': 'Adquieren granos',
    'hog_tuberc': 'Adquieren tubérculos/plátanos'
}

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_file_path = os.path.join(base_dir, '..', '..', 'data', 'temp', 'Tabla_dep_2023.csv')
json_ind_path = os.path.join(base_dir, 'datos_indicadores.json')

csv_ind_data = {}
with open(csv_file_path, 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        depto_code_raw = row.get('CodigoD', '')
        if not depto_code_raw:
            continue
        depto_code_clean = depto_code_raw.replace('D', '').strip()
        depto_code = str(int(depto_code_clean))
        
        dept_indicators = {}
        for csv_col, ivai_name in mapping_vars.items():
            if csv_col in row:
                val = clean_number(row[csv_col])
                dept_indicators[ivai_name] = val
        csv_ind_data[depto_code] = dept_indicators

with open(json_ind_path, 'w', encoding='utf-8') as f:
    json.dump(csv_ind_data, f, ensure_ascii=False, indent=2)
print("Done generating datos_indicadores.json for 2023")
