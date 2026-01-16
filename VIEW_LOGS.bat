@echo off
echo ============================================================
echo Smart Pilot - View Logs
echo ============================================================
echo.

set LOGFILE=%APPDATA%\smart-pilot\logs\smart-pilot.log

if exist "%LOGFILE%" (
    echo Opening log file:
    echo %LOGFILE%
    echo.
    echo ============================================================
    echo Last 50 lines:
    echo ============================================================
    powershell -Command "Get-Content '%LOGFILE%' -Tail 50"
    echo.
    echo ============================================================
    echo.
    echo Press any key to open in Notepad...
    pause >nul
    notepad "%LOGFILE%"
) else (
    echo Log file not found!
    echo Expected location: %LOGFILE%
    echo.
    echo Make sure you've run the app at least once.
    echo.
    pause
)
