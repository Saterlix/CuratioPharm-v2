CREATE USER curatio_user WITH PASSWORD 'cp_db_pass_2026!';
CREATE DATABASE curatio_db OWNER curatio_user;
GRANT ALL PRIVILEGES ON DATABASE curatio_db TO curatio_user;
