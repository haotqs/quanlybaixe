@echo off
echo Creating portable parking management app...

REM Create portable directory
mkdir portable-complete
cd portable-complete

REM Copy all necessary files
xcopy /E /I ..\public public
copy ..\server.js .
copy ..\package.json .
copy ..\*.md .
copy ..\*.bat .

REM Copy node_modules (thay vì npm install trên máy đích)
xcopy /E /I ..\node_modules node_modules

echo Portable app created in 'portable-complete' folder
echo Copy this entire folder to target machine and run start.bat
pause
