CREATE OR REPLACE VIEW current_release AS
  SELECT * FROM 
    (SELECT row_number()  over 
      (partition by app_id ORDER BY id DESC), * FROM release) rl
          WHERE rl.row_number =1;
-- vim: set filetype=pgsql :
