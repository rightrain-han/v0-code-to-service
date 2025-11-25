-- MSDS 시스템 데이터베이스 스키마 생성
-- 먼저 기존 테이블 삭제 (있는 경우)
DROP TABLE IF EXISTS msds_config_items CASCADE;
DROP TABLE IF EXISTS msds_protective_equipment CASCADE;
DROP TABLE IF EXISTS msds_warning_symbols CASCADE;
DROP TABLE IF EXISTS config_options CASCADE;
DROP TABLE IF EXISTS protective_equipment CASCADE;
DROP TABLE IF EXISTS warning_symbols CASCADE;
DROP TABLE IF EXISTS msds_items CASCADE;

-- 1. 기본 MSDS 항목 테이블
CREATE TABLE msds_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pdf_file_name VARCHAR(255),
  pdf_file_url TEXT,
  usage VARCHAR(255),
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 경고 표지 테이블
CREATE TABLE warning_symbols (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(50) DEFAULT 'physical',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 보호 장구 테이블
CREATE TABLE protective_equipment (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(50) DEFAULT 'respiratory',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 설정 옵션 테이블 (용도, 장소, 관련법 등)
CREATE TABLE config_options (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  value VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, value)
);

-- 5. MSDS-경고표지 연결 테이블
CREATE TABLE msds_warning_symbols (
  id SERIAL PRIMARY KEY,
  msds_id INTEGER REFERENCES msds_items(id) ON DELETE CASCADE,
  warning_symbol_id VARCHAR(50) REFERENCES warning_symbols(id) ON DELETE CASCADE,
  UNIQUE(msds_id, warning_symbol_id)
);

-- 6. MSDS-보호장구 연결 테이블
CREATE TABLE msds_protective_equipment (
  id SERIAL PRIMARY KEY,
  msds_id INTEGER REFERENCES msds_items(id) ON DELETE CASCADE,
  protective_equipment_id VARCHAR(50) REFERENCES protective_equipment(id) ON DELETE CASCADE,
  UNIQUE(msds_id, protective_equipment_id)
);

-- 7. MSDS-설정항목 연결 테이블 (장소, 관련법 등)
CREATE TABLE msds_config_items (
  id SERIAL PRIMARY KEY,
  msds_id INTEGER REFERENCES msds_items(id) ON DELETE CASCADE,
  config_type VARCHAR(50) NOT NULL,
  config_value VARCHAR(255) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_msds_items_name ON msds_items(name);
CREATE INDEX idx_msds_config_items_msds_id ON msds_config_items(msds_id);
CREATE INDEX idx_msds_config_items_type ON msds_config_items(config_type);

-- RLS 비활성화 (공개 데이터이므로)
ALTER TABLE msds_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protective_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE msds_warning_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE msds_protective_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE msds_config_items ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 생성
CREATE POLICY "Allow public read access" ON msds_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON warning_symbols FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON protective_equipment FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON config_options FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON msds_warning_symbols FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON msds_protective_equipment FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON msds_config_items FOR SELECT USING (true);
