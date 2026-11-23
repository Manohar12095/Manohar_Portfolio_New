@echo off
cd /d "%~dp0"
echo =======================================================
echo Pushing Manohar Portfolio V1.1 to GitHub and Opening PR...
echo =======================================================

echo.
echo 1. Pushing release/v1.1 branch...
git push origin release/v1.1
echo.

echo 2. Pushing feature/portfolio-enhancements branch...
git push origin feature/portfolio-enhancements
echo.

echo 3. Pushing main branch...
git push origin main
echo.

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Branches pushed to GitHub successfully!
    echo Opening Pull Request page in your browser...
    start https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...release/v1.1?expand=1
) else (
    echo [NOTICE] If prompted by Git Credential Manager, please sign in.
)

echo.
echo =======================================================
echo Direct Pull Request Link (V1.1):
echo https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...release/v1.1?expand=1
echo =======================================================
pause
