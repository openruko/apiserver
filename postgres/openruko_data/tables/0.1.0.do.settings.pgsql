CREATE TABLE IF NOT EXISTS settings
(
  key text NOT NULL,
  value text,
  CONSTRAINT settings_pkey PRIMARY KEY (key )
)
-- vim: set filetype=pgsql :
