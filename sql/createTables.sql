CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE encryptedFiles(
  file_id uuid DEFAULT uuid_generate_v4(),
  file_timestamp TIMESTAMP DEFAULT NOW(),
  file_name VARCHAR(80),
  original_file_name TEXT,
  original_file_mime TEXT,
  PRIMARY KEY (file_id)
);
