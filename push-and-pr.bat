@echo off
cd /d "%~dp0"
echo =======================================================
echo Pushing Manohar Portfolio to GitHub and Opening PR...
echo =======================================================

echo.
echo 1. Pushing feature/portfolio-enhancements branch...
git push origin feature/portfolio-enhancements
echo.

echo 2. Pushing main branch...
git push origin main
echo.

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Branches pushed to GitHub successfully!
    echo Opening Pull Request page in your browser...
    start https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...feature/portfolio-enhancements?expand=1
) else (
    echo [NOTICE] If prompted by Git Credential Manager, please sign in.
)

echo.
echo =======================================================
echo Direct Pull Request Link:
echo https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...feature/portfolio-enhancements?expand=1
echo =======================================================
pause
