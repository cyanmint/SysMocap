@echo off
REM Build script for SysMocap Web Version (Windows)
REM This script creates a production-ready web build

echo Building SysMocap Web Version...

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Clean previous build
echo Cleaning previous build...
if exist "web-build\" rmdir /s /q web-build
if exist "SysMocap-Web-Build.tar.gz" del /f SysMocap-Web-Build.tar.gz
if exist "SysMocap-Web-Build.zip" del /f SysMocap-Web-Build.zip

REM Create build directory
echo Creating build directory...
mkdir web-build

REM Copy application files
echo Copying application files...
xcopy /E /I /Y mainview web-build\mainview
xcopy /E /I /Y mocap web-build\mocap
xcopy /E /I /Y mocaprender web-build\mocaprender
xcopy /E /I /Y render web-build\render
xcopy /E /I /Y modelview web-build\modelview
xcopy /E /I /Y pdfviewer web-build\pdfviewer
xcopy /E /I /Y utils web-build\utils
xcopy /E /I /Y models web-build\models
xcopy /E /I /Y fonts web-build\fonts
xcopy /E /I /Y icons web-build\icons
xcopy /E /I /Y pdfs web-build\pdfs
xcopy /E /I /Y webserv web-build\webserv
xcopy /E /I /Y browser web-build\browser

REM Copy node_modules (only needed packages)
echo Copying dependencies...
mkdir web-build\node_modules
if exist "node_modules\@mediapipe" xcopy /E /I /Y node_modules\@mediapipe web-build\node_modules\@mediapipe
if exist "node_modules\@pixiv" xcopy /E /I /Y node_modules\@pixiv web-build\node_modules\@pixiv
if exist "node_modules\@material" xcopy /E /I /Y node_modules\@material web-build\node_modules\@material
if exist "node_modules\three" xcopy /E /I /Y node_modules\three web-build\node_modules\three
if exist "node_modules\kalidokit" xcopy /E /I /Y node_modules\kalidokit web-build\node_modules\kalidokit
if exist "node_modules\mdui" xcopy /E /I /Y node_modules\mdui web-build\node_modules\mdui
if exist "node_modules\vue" xcopy /E /I /Y node_modules\vue web-build\node_modules\vue
if exist "node_modules\lil-gui" xcopy /E /I /Y node_modules\lil-gui web-build\node_modules\lil-gui
if exist "node_modules\socket.io" xcopy /E /I /Y node_modules\socket.io web-build\node_modules\socket.io

REM Copy documentation
echo Copying documentation...
if exist "README.md" copy /Y README.md web-build\
if exist "LICENSE" copy /Y LICENSE web-build\
if exist "BROWSER_MIGRATION.md" copy /Y BROWSER_MIGRATION.md web-build\
if exist "BROWSER_DEV_GUIDE.md" copy /Y BROWSER_DEV_GUIDE.md web-build\
if exist "IMPLEMENTATION_SUMMARY.md" copy /Y IMPLEMENTATION_SUMMARY.md web-build\

REM Create root index.html
echo Creating index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>SysMocap - Browser Edition^</title^>
echo     ^<script^>
echo         window.location.href = 'mainview/framework.html';
echo     ^</script^>
echo ^</head^>
echo ^<body^>
echo     ^<p^>Loading SysMocap...^</p^>
echo ^</body^>
echo ^</html^>
) > web-build\index.html

REM Create version file
echo Creating version file...
for /f "tokens=*" %%a in ('git describe --tags 2^>nul') do set VERSION=%%a
if "%VERSION%"=="" set VERSION=dev
(
echo SysMocap Web Version
echo ====================
echo Version: %VERSION%
echo Build Date: %date% %time%
) > web-build\VERSION.txt

REM Create zip archive
echo Creating archive...
powershell Compress-Archive -Path web-build\* -DestinationPath SysMocap-Web-Build.zip -Force

echo.
echo Build complete!
echo.
echo Output files:
echo   - web-build\                     (Directory^)
echo   - SysMocap-Web-Build.zip
echo.
echo Next steps:
echo   1. Test locally: cd web-build ^&^& python -m http.server 8000
echo   2. Deploy to server
echo   3. Enable HTTPS for camera access
echo.
echo Ready for deployment!
