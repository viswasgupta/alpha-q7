@echo off
setlocal
cd /d "%~dp0"
if not exist server\.env copy server\.env.example server\.env >nul
if not exist server\node_modules\express npm install --prefix server
echo Public website: http://localhost:4000
echo Starting Alpha Q7 backend and public website...
npm run dev
