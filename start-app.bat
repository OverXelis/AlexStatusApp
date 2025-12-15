@echo off
echo Starting Alex Status App...

:: Change to the script's directory (where the project is)
cd /d "%~dp0"

:: Start npm in a new window so the script can continue
start "Alex Status App Server" cmd /k npm start

:: Wait 2 seconds for the server to start
timeout /t 2 /nobreak > nul

:: Open the browser to the frontend
start http://localhost:3001

echo.
echo Server is running! Browser should open shortly.
echo Close the server window or use the in-app shutdown button to stop.


