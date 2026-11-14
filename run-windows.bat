@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3, tick "Add to PATH", then run this again.
  pause
  exit /b 1
)
if not exist .env (
  copy .env.example .env >nul
  echo.
  echo A Notepad window is opening. Replace your_anthropic_api_key_here with your key, save, and close Notepad.
  echo With no key the server still runs, but uses plain extraction instead of the model.
  notepad .env
)
echo Installing what the server needs...
python -m pip install -q -r requirements.txt
if errorlevel 1 (
  echo The install failed. Check the message above.
  pause
  exit /b 1
)
echo.
echo Rind is starting. Your browser will open in a few seconds.
echo Leave this window open during the demo. Close it to stop the server.
start "" cmd /c "timeout /t 5 >nul & start http://127.0.0.1:8000"
python -m uvicorn main:app --port 8000
pause
