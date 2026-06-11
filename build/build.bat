@echo off
REM Project Equity - regenera os data files a partir da wiki.
REM Uso:  build.bat            (todas as empresas com wiki/TICKER.md)
REM       build.bat MSFT       (apenas uma)
cd /d "%~dp0"
python build.py %*
echo.
pause
