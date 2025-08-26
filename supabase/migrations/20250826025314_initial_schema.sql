

DROP TABLE IF EXISTS site;
CREATE TABLE IF NOT EXISTS site (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_name text NOT NULL,
  latitude float8,
  longitude float8,
  contact_name text,
  contact_phone text,
  is_armed boolean NOT NULL DEFAULT false,
  armed_changed_at timestamp with time zone,
);


DROP TABLE IF EXISTS bridge;
CREATE TABLE IF NOT EXISTS bridge (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id bigint NOT NULL,
  bridge_name text NOT NULL,
  healthy boolean NOT NULL DEFAULT true,
  last_checked timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (site_id) REFERENCES site(id)
);

DROP TABLE IF EXISTS camera;
CREATE TABLE IF NOT EXISTS camera (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bridge_id bigint NOT NULL,
  camera_name text NOT NULL,
  ip_address text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  healthy boolean NOT NULL DEFAULT true,
  last_checked timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (bridge_id) REFERENCES bridge(id)
);


-- site 테이블을 Realtime에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE site;

-- bridge 테이블을 Realtime에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE bridge;

-- camera 테이블을 Realtime에 추가  
ALTER PUBLICATION supabase_realtime ADD TABLE camera;