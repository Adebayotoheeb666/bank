@echo off
REM Development Startup Script with Health Check (Windows)
REM
REM Usage:
REM   .\scripts\dev-with-health-check.bat

echo.
echo 🚀 Starting JSM Banking App with Health Check...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
  echo 📦 Installing dependencies...
  call npm install
)

REM Run health check
echo 🏥 Running health check...
echo.

call npm run health-check

if %errorlevel% equ 0 (
  echo.
  echo ✅ Health check passed!
  echo.
  echo 🎯 Starting development server...
  echo.
  call npm run dev
) else (
  echo.
  echo ❌ Health check failed!
  echo.
  echo ⚠️  Some services may not be available:
  echo    - Check your .env.local file
  echo    - Verify Supabase project is running
  echo    - Check Plaid and Dwolla credentials
  echo.
  echo Starting development server anyway (may have limited functionality)...
  echo.
  call npm run dev
)

pause
