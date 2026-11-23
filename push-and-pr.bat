@echo off
cd /d "%~dp0"
echo =======================================================
echo Pushing Manohar Portfolio V1.2.0 to GitHub and Opening PR...
echo =======================================================

echo.
echo 1. Pushing release/v1.2.0 branch...
git push origin release/v1.2.0
echo.

echo 2. Pushing main branch...
git push origin main
echo.

echo 3. Pushing release tags (v1.2.0)...
git push origin --tags
echo.

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Branches pushed to GitHub successfully!
    echo Opening Pull Request page in your browser...
    start https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...release/v1.2.0?expand=1
) else (
    echo [NOTICE] If prompted by Git Credential Manager, please sign in.
)

echo.
echo =======================================================
echo Direct Pull Request Link (V 1.2.0):
echo https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...release/v1.2.0?expand=1
echo =======================================================
pause
