-- Get the anon key JWT secret info from the database
SELECT
  current_setting('app.settings.jwt_secret', true) AS jwt_secret,
  current_setting('request.jwt.claim.role', true) AS role;
