CREATE OR REPLACE FUNCTION install_addon_validation
(p_user_id integer, p_app_id integer, p_addon_name text)
RETURNS TABLE(addon_id text, config_vars text, password text,
              provider_url text, plan_price integer, contain_addon boolean) AS
$BODY$
DECLARE
  v_array_temp text[];
  v_addon_name text;
  v_addon_plan text;
  v_row_addon addon%rowtype;
  v_row_addon_plan addon_plan%rowtype;
  v_last_release_contain_addon boolean;
BEGIN

  v_array_temp = string_to_array(p_addon_name, ':');
  v_addon_name = v_array_temp[1];
  v_addon_plan = v_array_temp[2];

  -- get addon info
  SELECT * FROM addon
    WHERE addon.addon_id = v_addon_name
    INTO v_row_addon;

  IF v_row_addon IS NULL THEN
    RAISE EXCEPTION 'Addon not found.';
  END IF;

  -- get addon plan
  SELECT * FROM addon_plan
    WHERE addon_plan.plan_id = v_addon_plan
      AND addon_plan.addon_id = v_row_addon.id
     INTO v_row_addon_plan;

  IF v_row_addon_plan IS NULL THEN
    RAISE EXCEPTION 'Addon plan not found.';
  END IF;

  -- check if addon is already on last release
  SELECT EXISTS(
    SELECT id FROM release
      WHERE release.app_id = p_app_id
        AND release.addons @> ARRAY[v_addon_name]
      ORDER BY id DESC LIMIT 1;
      var addonId = addonRow.addon_id;
  ) INTO v_last_release_contain_addon;

  RETURN QUERY SELECT v_row_addon.addon_id AS addon_id,
                      v_row_addon.config_vars AS config_vars,
                      v_row_addon.password AS password,
                      v_row_addon.url AS provider_url,
                      v_row_addon_plan.price_cents AS plan_price,
                      v_last_release_contain_addon AS contain_addon;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
