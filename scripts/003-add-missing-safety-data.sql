-- 누락된 경고 표지 추가 (GHS 기호 전체)
-- 이 스크립트는 기존 데이터베이스에 누락된 경고 표지와 보호 장구를 추가합니다.

-- 새로운 경고 표지 추가
INSERT INTO warning_symbols (id, name, description, image_url, category, is_active) VALUES
  ('explosive', '폭발성', '폭발하거나 대량 폭발할 수 있음', '/images/symbols/explosive.png', 'physical', true),
  ('compressed_gas', '고압가스', '가압된 가스를 담고 있으며, 가열하면 폭발할 수 있음', '/images/symbols/compressed_gas.png', 'physical', true),
  ('irritant', '자극성', '피부나 눈에 자극을 일으킬 수 있음', '/images/symbols/irritant.png', 'health', true)
ON CONFLICT (id) DO NOTHING;

-- 새로운 보호 장구 추가
INSERT INTO protective_equipment (id, name, description, image_url, category, is_active) VALUES
  ('safety_glasses', '보안경', '눈 보호를 위해 착용', '/images/protective/safety_glasses.png', 'eye', true),
  ('face_shield', '안면보호구', '안면 보호를 위해 착용', '/images/protective/face_shield.png', 'eye', true),
  ('gas_mask', '방독마스크', '유해 가스 차단을 위해 착용', '/images/protective/gas_mask.png', 'respiratory', true),
  ('dust_mask', '방진마스크', '분진 차단을 위해 착용', '/images/protective/dust_mask.png', 'respiratory', true),
  ('chemical_gloves', '내화학장갑', '화학물질로부터 손 보호를 위해 착용', '/images/protective/chemical_gloves.png', 'hand', true),
  ('heat_gloves', '내열장갑', '고온으로부터 손 보호를 위해 착용', '/images/protective/heat_gloves.png', 'hand', true),
  ('protective_suit', '보호복', '전신 보호를 위해 착용', '/images/protective/protective_suit.png', 'body', true),
  ('safety_shoes', '안전화', '발 보호를 위해 착용', '/images/protective/safety_shoes.png', 'foot', true)
ON CONFLICT (id) DO NOTHING;
