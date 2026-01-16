@echo off
echo ============================================================
echo Smart Pilot - Lokale Debug Run
echo ============================================================
echo.
echo Dit script start Smart Pilot in development mode met:
echo - Uitgebreide console logging
echo - Automatisch geopende DevTools
echo - Log file in: %%APPDATA%%\smart-pilot\logs\
echo.
echo ============================================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js niet gevonden!
    echo Download van: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js versie:
node --version
echo.

echo Checking dependencies...
if not exist "node_modules" (
    echo Dependencies niet gevonden, installeren...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
)

echo.
echo Building app...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    echo Check errors above
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Starting Smart Pilot...
echo ============================================================
echo.
echo Log file locatie:
echo %APPDATA%\smart-pilot\logs\smart-pilot.log
echo.
echo Press Ctrl+C to stop
echo ============================================================
echo.

call npm start

pause
