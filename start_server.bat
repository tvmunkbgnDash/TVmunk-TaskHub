@echo off
title TVmunk - bgn TaskHub Server
cd /d "C:\Users\User\Downloads\08_Projects\TVmunk-bgn-TaskHub"
echo ========================================================
echo   TVmunk - bgn Task & HR Leave Hub
echo   Server is running at:
echo   - Localhost: http://localhost:3000
echo   - Office LAN: http://192.168.1.51:3000
echo ========================================================
"C:\Program Files\nodejs\node.exe" server.js
pause