

DROP TABLE IF EXISTS site CASCADE;
CREATE TABLE IF NOT EXISTS site (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_name text NOT NULL,
  contact_name text,
  contact_phone text,
  logo_url text, -- company logo URL
  arm_status text NOT NULL DEFAULT 'disarm', -- arm, disarm
  arm_status_changed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);


DROP TABLE IF EXISTS bridge CASCADE;
CREATE TABLE IF NOT EXISTS bridge (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bridge_uuid uuid UNIQUE NOT NULL,
  site_id bigint,
  bridge_name text NOT NULL,
  access_token text,
  healthy boolean NOT NULL DEFAULT true,
  last_checked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  FOREIGN KEY (site_id) REFERENCES site(id)
);

DROP TABLE IF EXISTS camera CASCADE;
CREATE TABLE IF NOT EXISTS camera (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bridge_id bigint NOT NULL,
  camera_name text NOT NULL,
  ip_address text NOT NULL,
  
  username text NOT NULL,
  password text NOT NULL,
  is_registered boolean NOT NULL DEFAULT false,
  healthy boolean NOT NULL DEFAULT true,
  last_checked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  FOREIGN KEY (bridge_id) REFERENCES bridge(id),
  UNIQUE (bridge_id, ip_address)
);


DROP TABLE IF EXISTS alarm CASCADE;
CREATE TABLE IF NOT EXISTS alarm (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id bigint NOT NULL,
  bridge_id bigint NOT NULL,
  camera_id bigint NOT NULL,
  alarm_name text NOT NULL,
  alarm_type text NOT NULL,
  last_alarm_at timestamp with time zone NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  snapshot_urls text[],

  FOREIGN KEY (site_id) REFERENCES site(id),
  FOREIGN KEY (bridge_id) REFERENCES bridge(id),
  FOREIGN KEY (camera_id) REFERENCES camera(id)
);