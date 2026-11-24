@echo off
cd /d "%~dp0"
echo =======================================================
echo Preparing and Pushing Pull Request V1.2.0 to GitHub...
echo =======================================================

echo.
echo 1. Pushing release/v1.2.0 branch (latest V1.2.0 changes)...
git push origin release/v1.2.0:release/v1.2.0 --force
echo.

echo 2. Aligning base main branch for Pull Request...
git push origin 61c9be7:main --force
echo.

echo 3. Pushing release tags (v1.2.0)...
git push origin --tags
echo.

echo.
echo =======================================================
echo [SUCCESS] Pull Request is ready to create on GitHub!
echo Opening Pull Request comparison in your browser...
echo =======================================================
start https://github.com/Manohar12095/Manohar_Portfolio_New/compare/main...release/v1.2.0?expand=1
echo.
pause
