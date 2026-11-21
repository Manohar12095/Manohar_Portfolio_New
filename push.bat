@echo off
setlocal EnableExtensions
title Push to GitHub - Manohar Portfolio
cd /d "%~dp0"

echo.
echo ==============================================================
echo        MANOHAR PORTFOLIO - 1-CLICK GITHUB PUSH
echo ==============================================================
echo.

rem Check git installation
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

rem Check git status
echo [1/4] Checking repository status...
git status -s
echo.

set "MSG="
set /p MSG="Enter commit message (Press ENTER for default: 'update portfolio'): "
if "%MSG%"=="" set "MSG=update: portfolio content and enhancements"

echo.
echo [2/4] Staging all modified files...
git add -A

echo [3/4] Committing with message: "%MSG%"...
git commit -m "%MSG%"

echo.
echo [4/4] Pushing to GitHub (origin main)...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==============================================================
    echo  [SUCCESS] All changes pushed to GitHub successfully!
    echo  Vercel is now automatically deploying your live website:
    echo  https://manohar-portfolio-gray.vercel.app
    echo ==============================================================
) else (
    echo.
    echo [FAILED] Git push encountered an error. Please check your internet connection or git credentials.
)

echo.
pause

