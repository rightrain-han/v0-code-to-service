-- RLS 정책 수정 - 모든 CRUD 작업 허용
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow public read access" ON msds_items;
DROP POLICY IF EXISTS "Allow public read access" ON warning_symbols;
DROP POLICY IF EXISTS "Allow public read access" ON protective_equipment;
DROP POLICY IF EXISTS "Allow public read access" ON config_options;
DROP POLICY IF EXISTS "Allow public read access" ON msds_warning_symbols;
DROP POLICY IF EXISTS "Allow public read access" ON msds_protective_equipment;
DROP POLICY IF EXISTS "Allow public read access" ON msds_config_items;

-- msds_items 정책
CREATE POLICY "Allow all access" ON msds_items FOR ALL USING (true) WITH CHECK (true);

-- warning_symbols 정책
CREATE POLICY "Allow all access" ON warning_symbols FOR ALL USING (true) WITH CHECK (true);

-- protective_equipment 정책
CREATE POLICY "Allow all access" ON protective_equipment FOR ALL USING (true) WITH CHECK (true);

-- config_options 정책
CREATE POLICY "Allow all access" ON config_options FOR ALL USING (true) WITH CHECK (true);

-- msds_warning_symbols 정책
CREATE POLICY "Allow all access" ON msds_warning_symbols FOR ALL USING (true) WITH CHECK (true);

-- msds_protective_equipment 정책
CREATE POLICY "Allow all access" ON msds_protective_equipment FOR ALL USING (true) WITH CHECK (true);

-- msds_config_items 정책
CREATE POLICY "Allow all access" ON msds_config_items FOR ALL USING (true) WITH CHECK (true);
