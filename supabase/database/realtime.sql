-- site 테이블을 Realtime에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE site;

-- bridge 테이블을 Realtime에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE bridge;

-- camera 테이블을 Realtime에 추가  
ALTER PUBLICATION supabase_realtime ADD TABLE camera;