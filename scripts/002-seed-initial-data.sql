-- 초기 데이터 삽입

-- 경고 표지 기본 데이터 (GHS 기호 전체)
INSERT INTO warning_symbols (id, name, description, image_url, category, is_active) VALUES
  ('explosive', '폭발성', '폭발하거나 대량 폭발할 수 있음', '/images/symbols/explosive.png', 'physical', true),
  ('flammable', '인화성', '쉽게 불이 붙을 수 있음', '/images/symbols/flammable.png', 'physical', true),
  ('oxidizing', '산화성', '화재를 일으키거나 강화시킬 수 있음', '/images/symbols/oxidizing.png', 'physical', true),
  ('compressed_gas', '고압가스', '가압된 가스를 담고 있으며, 가열하면 폭발할 수 있음', '/images/symbols/compressed_gas.png', 'physical', true),
  ('corrosive', '부식성', '피부나 눈에 심각한 화상을 일으킬 수 있음', '/images/symbols/corrosive.png', 'physical', true),
  ('toxic', '급성독성', '삼키거나 흡입하면 생명에 위험할 수 있음', '/images/symbols/toxic.png', 'health', true),
  ('irritant', '자극성', '피부나 눈에 자극을 일으킬 수 있음', '/images/symbols/irritant.png', 'health', true),
  ('health_hazard', '건강 유해성', '호흡기, 생식기능 또는 기타 장기에 손상을 일으킬 수 있음', '/images/symbols/health_hazard.png', 'health', true),
  ('environmental', '환경 유해성', '수생생물에 유독하며 장기적 영향을 일으킬 수 있음', '/images/symbols/environmental.png', 'environmental', true)
ON CONFLICT (id) DO NOTHING;

-- 보호 장구 기본 데이터 (보호장구 전체)
INSERT INTO protective_equipment (id, name, description, image_url, category, is_active) VALUES
  ('safety_glasses', '보안경', '눈 보호를 위해 착용', '/images/protective/safety_glasses.png', 'eye', true),
  ('face_shield', '안면보호구', '안면 보호를 위해 착용', '/images/protective/face_shield.png', 'eye', true),
  ('gas_mask', '방독마스크', '유해 가스 차단을 위해 착용', '/images/protective/gas_mask.png', 'respiratory', true),
  ('dust_mask', '방진마스크', '분진 차단을 위해 착용', '/images/protective/dust_mask.png', 'respiratory', true),
  ('chemical_gloves', '내화학장갑', '화학물질로부터 손 보호를 위해 착용', '/images/protective/chemical_gloves.png', 'hand', true),
  ('heat_gloves', '내열장갑', '고온으로부터 손 보호를 위해 착용', '/images/protective/heat_gloves.png', 'hand', true),
  ('protective_suit', '보호복', '전신 보호를 위해 착용', '/images/protective/protective_suit.png', 'body', true),
  ('safety_shoes', '안전화', '발 보호를 위해 착용', '/images/protective/safety_shoes.png', 'foot', true),
  -- 레거시 ID 유지 (기존 데이터 호환성)
  ('flammable', '인화성 보호구', '인화성 물질 취급 시 착용', '/images/protective/flammable.png', 'body', true),
  ('toxic', '독성 보호구', '독성 물질 취급 시 착용', '/images/protective/toxic.png', 'respiratory', true),
  ('corrosive', '부식성 보호구', '부식성 물질 취급 시 착용', '/images/protective/corrosive.png', 'eye', true),
  ('oxidizing', '산화성 보호구', '산화성 물질 취급 시 착용', '/images/protective/oxidizing.png', 'hand', true)
ON CONFLICT (id) DO NOTHING;

-- 설정 옵션 기본 데이터
INSERT INTO config_options (type, value, label, is_active) VALUES
  ('usage', 'pure_reagent', '순수시약', true),
  ('usage', 'nox_reduction', 'NOx저감', true),
  ('usage', 'wastewater_treatment', '폐수처리', true),
  ('usage', 'boiler_water_treatment', '보일러용수처리', true),
  ('usage', 'chemical_field', '과학물질분야', true),
  ('usage', 'fuel', '연료', true),
  ('reception', 'lng_3_cpp', 'LNG 3호기 CPP', true),
  ('reception', 'lng_4_cpp', 'LNG 4호기 CPP', true),
  ('reception', 'water_treatment', '수처리동', true),
  ('reception', 'bio_2_scr', 'BIO 2호기 SCR', true),
  ('reception', 'lng_4_scr', 'LNG 4호기 SCR', true),
  ('laws', 'chemical_safety', '화학물질안전법', true),
  ('laws', 'industrial_safety', '산업안전보건법', true)
ON CONFLICT (type, value) DO NOTHING;

-- 샘플 MSDS 데이터
INSERT INTO msds_items (name, pdf_file_name, usage) VALUES
  ('염산 35%', 'HYDROCHLORIC_ACID.pdf', '순수시약'),
  ('가성소다 45%', 'SODIUM_HYDROXIDE.pdf', '순수시약'),
  ('황산 98%', 'SULFURIC_ACID.pdf', 'NOx저감')
ON CONFLICT DO NOTHING;

-- MSDS-경고표지 연결
INSERT INTO msds_warning_symbols (msds_id, warning_symbol_id)
SELECT m.id, 'corrosive' FROM msds_items m WHERE m.name = '염산 35%'
ON CONFLICT DO NOTHING;

INSERT INTO msds_warning_symbols (msds_id, warning_symbol_id)
SELECT m.id, 'toxic' FROM msds_items m WHERE m.name = '염산 35%'
ON CONFLICT DO NOTHING;

INSERT INTO msds_warning_symbols (msds_id, warning_symbol_id)
SELECT m.id, 'corrosive' FROM msds_items m WHERE m.name = '가성소다 45%'
ON CONFLICT DO NOTHING;

-- MSDS-보호장구 연결
INSERT INTO msds_protective_equipment (msds_id, protective_equipment_id)
SELECT m.id, 'corrosive' FROM msds_items m WHERE m.name = '염산 35%'
ON CONFLICT DO NOTHING;

INSERT INTO msds_protective_equipment (msds_id, protective_equipment_id)
SELECT m.id, 'toxic' FROM msds_items m WHERE m.name = '염산 35%'
ON CONFLICT DO NOTHING;

-- MSDS-설정항목 연결 (장소, 관련법)
INSERT INTO msds_config_items (msds_id, config_type, config_value)
SELECT m.id, 'reception', 'LNG 3호기 CPP' FROM msds_items m WHERE m.name = '염산 35%';

INSERT INTO msds_config_items (msds_id, config_type, config_value)
SELECT m.id, 'reception', '수처리동' FROM msds_items m WHERE m.name = '염산 35%';

INSERT INTO msds_config_items (msds_id, config_type, config_value)
SELECT m.id, 'laws', '화학물질안전법' FROM msds_items m WHERE m.name = '염산 35%';

INSERT INTO msds_config_items (msds_id, config_type, config_value)
SELECT m.id, 'laws', '산업안전보건법' FROM msds_items m WHERE m.name = '염산 35%';
