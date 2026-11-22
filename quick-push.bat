@echo off
cd /d "%~dp0"
echo =======================================================
echo Pushing Manohar Portfolio to GitHub (origin main)...
echo =======================================================
git push origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Pushed to GitHub successfully!
    echo Vercel is now deploying your changes.
) else (
    echo [NOTICE] If prompted by Git Credential Manager, please sign in.
)
echo.
pause

