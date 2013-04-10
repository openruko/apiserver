CREATE TABLE IF NOT EXISTS addon_plan
(
  id serial NOT NULL,
  addon_id integer NOT NULL,
  plan_id text NOT NULL,
  description text,
  price_cents integer DEFAULT 0,
  price_unit text DEFAULT 'month',

  CONSTRAINT addon_plan_pkey PRIMARY KEY (id)
)
-- vim: set filetype=pgsql :
