CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE encryptedfiles(
  file_id uuid DEFAULT uuid_generate_v4(),
  file_timestamp TIMESTAMP DEFAULT NOW(),
  file_name VARCHAR(80),
  original_file_name TEXT,
  original_file_mime TEXT,
  PRIMARY KEY (file_id)
);

CREATE TABLE requestedfiles(
  r_file_id uuid NOT NULL,
  r_file_name VARCHAR(80),
  r_file_timestamp TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (r_file_id)
);
