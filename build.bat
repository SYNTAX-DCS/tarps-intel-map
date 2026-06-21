@echo off
setlocal

pushd "%~dp0"
if errorlevel 1 (
  echo Failed to enter project directory.
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency install failed.
    popd
    exit /b 1
  )
)

echo Building TARPS Intel Map portable Windows app...
call npm run pack:win
set BUILD_EXIT_CODE=%ERRORLEVEL%

if not "%BUILD_EXIT_CODE%"=="0" (
  echo Build failed with exit code %BUILD_EXIT_CODE%.
  popd
  exit /b %BUILD_EXIT_CODE%
)

echo Build complete. Output is in the dist folder.
popd
exit /b 0
