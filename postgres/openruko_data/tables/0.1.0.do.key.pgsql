CREATE TABLE IF NOT EXISTS key
(
  id serial NOT NULL,
  user_id integer,
  key_type text NOT NULL,
  key_key text NOT NULL,
  key_fingerprint text NOT NULL,
  key_note text,
  created_at timestamp without time zone NOT NULL,
  CONSTRAINT keys_pkey PRIMARY KEY (id ),
  CONSTRAINT unique_key UNIQUE (key_key),
  CONSTRAINT unique_fingerprint UNIQUE (key_fingerprint)
  /*CONSTRAINT keys_user_id_fkey FOREIGN KEY (user_id)*/
  /*    REFERENCES oruser (id) MATCH SIMPLE*/
  /*    ON UPDATE NO ACTION ON DELETE NO ACTION*/
)
-- vim: set filetype=pgsql :
