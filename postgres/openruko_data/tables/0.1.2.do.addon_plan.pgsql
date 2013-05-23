CREATE TABLE IF NOT EXISTS addon_plan
(
  id serial NOT NULL,
  addon_id integer NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer DEFAULT 0,
  price_unit text DEFAULT 'month',

  CONSTRAINT addon_plan_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
