@echo off
rem =====================================================================
rem  portfolio.bat  -  run, update, build and publish the portfolio.
rem
rem  Double-click it for the menu.
rem  Or drag an update .zip from Claude onto this file to apply it.
rem  What changed in each version: CHANGELOG.md  (menu option N)
rem
rem  Notes for whoever edits this file (you, Claude, Antigravity):
rem   - Keep it ASCII only and keep Windows (CRLF) line endings.
rem   - Always write  call npm ...  (without call the script stops after npm).
rem   - Avoid ( ) blocks around anything that holds a path. A path such as
rem     "C:\Users\Me (1)\site" would close the block early.
rem   - When you change how the project runs, bump BAT_VERSION below and add
rem     a line to CHANGELOG.md.
rem =====================================================================
setlocal EnableExtensions
set "BAT_VERSION=1.3"
set "BAT_DATE=2026-11-19"
title Manohar portfolio

cd /d "%~dp0"
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

if not exist "%ROOT%\package.json" goto :wrong_folder
if /i "%~x1"==".zip" goto :zip_from_drag
goto :menu

:wrong_folder
echo.
echo   package.json was not found next to portfolio.bat.
echo   Put portfolio.bat inside the manohar-3d-portfolio folder and run it again.
echo.
pause
exit /b 1

:zip_from_drag
set "ZIP=%~f1"
goto :apply_zip


rem =====================================================================
rem  MENU
rem =====================================================================
:menu
cls
echo.
echo   ==============================================================
echo     MANOHAR PORTFOLIO - control panel          v%BAT_VERSION%  %BAT_DATE%
echo   ==============================================================
echo     Folder: "%ROOT%"
echo.
echo     1   Start the website                 opens it in your browser
echo     2   Start and open the admin page
echo     3   Start and test on my phone        same Wi-Fi
echo     4   Apply an update from Claude       a .zip file
echo     5   Build the final site              and preview it
echo     6   Put it online                     Git push, Vercel updates
echo     7   Back up now
echo     8   Restore a backup
echo     9   Fix problems                      reinstall packages
echo     N   What is new in this version
echo     Q   Quit
echo.
choice /c 123456789NQ /n /m "  Choose a number or letter: "
set "PICK=%errorlevel%"
if %PICK% GTR 11 goto :menu
if %PICK% LSS 1 goto :menu
goto :opt%PICK%


rem =====================================================================
rem  1, 2, 3  START THE WEBSITE
rem =====================================================================
:opt1
set "DEV_ARGS=--open"
set "DEV_HINT="
goto :run_dev

:opt2
set "DEV_ARGS=--open /admin"
set "DEV_HINT="
goto :run_dev

:opt3
set "DEV_ARGS=--host --open"
set "DEV_HINT=Look for the Network line below and open that address on your phone."
goto :run_dev

:run_dev
call :need_node
if errorlevel 1 goto :menu
call :install_if_needed
if errorlevel 1 goto :menu
echo.
echo   Starting the website. Keep this window open while you work.
echo   Your browser opens by itself. The admin page is at /admin.
if defined DEV_HINT echo   %DEV_HINT%
echo   To stop: press Ctrl+C, then Y.
echo.
call npm run dev -- %DEV_ARGS%
echo.
pause
goto :menu


rem =====================================================================
rem  4  APPLY AN UPDATE FROM CLAUDE
rem =====================================================================
:opt4
set "ZIP="
call :find_download_zip
if defined ZIP goto :apply_zip
echo.
echo   Drag the update .zip file into this window, then press Enter.
set /p "ZIP=  File: "
goto :apply_zip

:find_download_zip
set "FOUND="
for /f "delims=" %%F in ('dir /b /o-d "%USERPROFILE%\Downloads\manohar-3d-portfolio*.zip" 2^>nul') do if not defined FOUND set "FOUND=%USERPROFILE%\Downloads\%%F"
if not defined FOUND exit /b 0
echo.
echo   Found the newest update in your Downloads folder:
echo   "%FOUND%"
choice /c YN /m "  Use this one"
if errorlevel 2 exit /b 0
set "ZIP=%FOUND%"
exit /b 0

:apply_zip
if not defined ZIP goto :menu
set "ZIP=%ZIP:"=%"
:trim_zip
if not defined ZIP goto :menu
if not "%ZIP:~-1%"==" " goto :zip_trimmed
set "ZIP=%ZIP:~0,-1%"
goto :trim_zip
:zip_trimmed
if not exist "%ZIP%" goto :zip_missing
if /i not "%ZIP:~-4%"==".zip" goto :zip_notzip

echo.
echo   Step 1 of 4   Backing up your current project...
call :make_backup before-update
if errorlevel 1 goto :update_failed
echo   Saved to "%BK%"

echo   Step 2 of 4   Unpacking the update...
call :stamp
set "TMPX=%TEMP%\portfolio-update-%STAMP%"
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Expand-Archive -LiteralPath $env:ZIP -DestinationPath $env:TMPX -Force"
if errorlevel 1 goto :update_failed
set "SRC=%TMPX%"
if exist "%SRC%\package.json" goto :src_ok
for /d %%D in ("%TMPX%\*") do if exist "%%~fD\package.json" set "SRC=%%~fD"
if not exist "%SRC%\package.json" goto :zip_wrong
:src_ok

echo.
echo   Step 3 of 4   Your own text and theme settings
echo.
echo     K   Keep mine   your current src\data\content.js and themes.js stay as they are
echo     N   Use new     take them from the update. Choose this when Claude said the
echo                     update changes your content or themes.
echo.
set "KEEP=1"
choice /c KN /n /m "  Keep or New  [K/N]: "
if errorlevel 2 set "KEEP=0"
if "%KEEP%"=="1" mkdir "%TMPX%\_keep" 2>nul
if "%KEEP%"=="1" copy /y "%ROOT%\src\data\content.js" "%TMPX%\_keep\content.js" >nul
if "%KEEP%"=="1" copy /y "%ROOT%\src\data\themes.js" "%TMPX%\_keep\themes.js" >nul

echo.
echo   Step 4 of 4   Copying the new files...
robocopy "%SRC%" "%ROOT%" /E /R:2 /W:1 /XD node_modules dist .git _backups _keep public /XF portfolio.bat .env .env.local .env.production /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :update_failed
rem public\ holds your own photos and videos: only add files that are not there yet
if exist "%SRC%\public" robocopy "%SRC%\public" "%ROOT%\public" /E /R:2 /W:1 /XC /XN /XO /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :update_failed
if "%KEEP%"=="1" copy /y "%TMPX%\_keep\content.js" "%ROOT%\src\data\content.js" >nul
if "%KEEP%"=="1" copy /y "%TMPX%\_keep\themes.js" "%ROOT%\src\data\themes.js" >nul

rem a changed portfolio.bat cannot replace itself while it runs: stage it, swap it after this window closes
set "SELF=0"
if not exist "%SRC%\portfolio.bat" goto :after_self
fc /b "%SRC%\portfolio.bat" "%~f0" >nul 2>nul
if errorlevel 1 set "SELF=1"
if "%SELF%"=="1" copy /y "%SRC%\portfolio.bat" "%ROOT%\portfolio.bat.new" >nul
:after_self

rem copied files keep the zip's dates, so force the package check
del "%ROOT%\node_modules\.portfolio-stamp" 2>nul
call :need_node
if errorlevel 1 goto :update_done
call :install_if_needed

:update_done
rmdir /s /q "%TMPX%" 2>nul
echo.
echo   Update applied.
echo   Your previous version is saved in "%BK%"
echo   If something looks wrong, choose 8 in the menu to go back.
call :show_news
echo.
pause
if "%SELF%"=="1" goto :self_update
goto :menu

:self_update
echo.
echo   portfolio.bat itself was improved in this update.
echo   This window closes now. Double-click portfolio.bat again to use the new one.
echo.
pause
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & move /y portfolio.bat.new portfolio.bat >nul"
exit /b 0

:zip_missing
echo.
echo   That file was not found:
echo   "%ZIP%"
echo.
pause
goto :menu

:zip_notzip
echo.
echo   That is not a .zip file:
echo   "%ZIP%"
echo.
pause
goto :menu

:zip_wrong
echo.
echo   This zip does not look like the portfolio project (no package.json inside).
echo   Nothing was changed except the backup.
echo.
rmdir /s /q "%TMPX%" 2>nul
pause
goto :menu

:update_failed
echo.
echo   The update did not finish.
if defined BK echo   Your project was backed up first. Choose 8 in the menu to restore it.
echo.
rmdir /s /q "%TMPX%" 2>nul
pause
goto :menu


rem =====================================================================
rem  5  BUILD THE FINAL SITE
rem =====================================================================
:opt5
call :need_node
if errorlevel 1 goto :menu
call :install_if_needed
if errorlevel 1 goto :menu
echo.
echo   Building the final site into the dist folder...
echo.
call npm run build
if errorlevel 1 goto :build_failed
echo.
echo   Build finished. The dist folder is what gets published.
choice /c YN /m "  Preview the built site in your browser now"
if errorlevel 2 goto :menu
echo.
echo   Previewing. Press Ctrl+C, then Y to stop.
call npm run preview -- --open
echo.
pause
goto :menu

:build_failed
echo.
echo   The build failed. Read the first error above.
echo   Tip: copy it into Antigravity with /ralph-loop and ask it to fix the build.
echo.
pause
goto :menu


rem =====================================================================
rem  6  PUT IT ONLINE (Git push, then Vercel publishes by itself)
rem =====================================================================
:opt6
where git >nul 2>nul
if errorlevel 1 goto :git_missing
if not exist "%ROOT%\.git" goto :git_notrepo
echo.
echo   Files that changed:
echo.
git status --short
echo.
set "MSG="
set /p "MSG=  Describe this change in a few words (Enter = Update portfolio): "
if not defined MSG set "MSG=Update portfolio"
set "MSG=%MSG:"=%"
echo.
choice /c YN /m "  Save this and push it to GitHub now"
if errorlevel 2 goto :menu
git add -A
git commit -m "%MSG%"
if errorlevel 1 goto :commit_failed
git push
if errorlevel 1 goto :push_failed
echo.
echo   Pushed. Vercel starts publishing now. It usually takes a minute or two.
echo.
pause
goto :menu

:commit_failed
echo.
echo   Git did not save the change, so nothing was pushed.
echo   If the message above says nothing to commit, there is nothing new to publish.
echo   If it asks for your name and email, run these once, then try again:
echo     git config --global user.name "Your Name"
echo     git config --global user.email "you@example.com"
echo.
pause
goto :menu

:push_failed
echo.
echo   Git could not finish. Read the message above.
echo   If it asks you to sign in or set a name, follow what it says, then try again.
echo.
pause
goto :menu

:git_missing
echo.
echo   Git is not installed. Install it from https://git-scm.com or run:
echo   winget install Git.Git
echo   Then close this window and open portfolio.bat again.
echo.
pause
goto :menu

:git_notrepo
echo.
echo   This folder is not connected to GitHub yet. Do this once:
echo     1. Create an empty repository on github.com
echo     2. In this folder run:   git init
echo                              git add -A
echo                              git commit -m "First version"
echo                              git branch -M main
echo                              git remote add origin YOUR_REPOSITORY_URL
echo                              git push -u origin main
echo     3. Connect the repository to Vercel (Add New, Project).
echo   After that, this menu option does the publishing for you.
echo   If you already deploy from a different folder, copy the new files there instead.
echo.
pause
goto :menu


rem =====================================================================
rem  7  BACK UP NOW
rem =====================================================================
:opt7
call :make_backup manual
if errorlevel 1 goto :backup_failed
echo.
echo   Backup saved to:
echo   "%BK%"
echo   It holds your project files without node_modules and dist.
echo.
pause
goto :menu

:backup_failed
echo.
echo   The backup did not finish. Check that the disk is not full.
echo.
pause
goto :menu


rem =====================================================================
rem  8  RESTORE A BACKUP
rem =====================================================================
:opt8
if not exist "%ROOT%\_backups" goto :no_backups
echo.
echo   Your backups, newest first:
echo.
set "N=0"
for /f "delims=" %%D in ('dir /b /ad /o-n "%ROOT%\_backups" 2^>nul') do call :list_one "%%D"
if "%N%"=="0" goto :no_backups
echo.
set "WHICH="
set /p "WHICH=  Type the number to restore, or press Enter to cancel: "
if not defined WHICH goto :menu
set "WHICH=%WHICH:"=%"
for /f "delims=0123456789" %%x in ("%WHICH%") do goto :menu
if %WHICH% LSS 1 goto :menu
if %WHICH% GTR %N% goto :menu
set "CHOSEN="
call set "CHOSEN=%%BK_%WHICH%%%"
if not defined CHOSEN goto :menu
echo.
echo   This copies the files from this backup back into your project:
echo   "%ROOT%\_backups\%CHOSEN%"
echo   Files you added after that backup are left alone.
echo   Your current state is saved first, so you can undo this too.
choice /c YN /m "  Restore it"
if errorlevel 2 goto :menu
call :make_backup before-restore
if errorlevel 1 goto :restore_failed
robocopy "%ROOT%\_backups\%CHOSEN%" "%ROOT%" /E /R:2 /W:1 /XF portfolio.bat /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :restore_failed
del "%ROOT%\node_modules\.portfolio-stamp" 2>nul
echo.
echo   Restored. The next start checks the packages again.
echo.
pause
goto :menu

:list_one
if %N% GEQ 15 exit /b 0
set /a N+=1
set "BK_%N%=%~1"
echo     %N%   %~1
exit /b 0

:no_backups
echo.
echo   There are no backups yet. Choose 7 to make one.
echo.
pause
goto :menu

:restore_failed
echo.
echo   The restore did not finish. Nothing was deleted. Try again, or copy the files by hand.
echo.
pause
goto :menu


rem =====================================================================
rem  9  FIX PROBLEMS
rem =====================================================================
:opt9
call :need_node
if errorlevel 1 goto :menu
echo.
echo   This deletes the node_modules and dist folders and installs everything again.
echo   Your own files are not touched. Close any other window that runs the site first.
choice /c YN /m "  Continue"
if errorlevel 2 goto :menu
del "%ROOT%\node_modules\.portfolio-stamp" 2>nul
if exist "%ROOT%\node_modules" rmdir /s /q "%ROOT%\node_modules"
if exist "%ROOT%\dist" rmdir /s /q "%ROOT%\dist"
call :install_if_needed
if errorlevel 1 goto :menu
echo.
echo   Done. Try option 1 again.
echo.
pause
goto :menu


rem =====================================================================
rem  N  WHAT IS NEW
rem =====================================================================
:opt10
call :show_news
echo.
pause
goto :menu

:show_news
echo.
if not exist "%ROOT%\CHANGELOG.md" goto :no_news
powershell -NoProfile -Command "Get-Content -LiteralPath 'CHANGELOG.md' -TotalCount 45"
exit /b 0
:no_news
echo   No CHANGELOG.md found.
exit /b 0


rem =====================================================================
rem  Q  QUIT
rem =====================================================================
:opt11
endlocal
exit /b 0


rem =====================================================================
rem  SHARED STEPS
rem =====================================================================

rem --- checks that Node.js 18 or newer is installed ---
:need_node
where node >nul 2>nul
if errorlevel 1 goto :node_missing
where npm >nul 2>nul
if errorlevel 1 goto :node_missing
set "NODE_MAJOR=0"
for /f "tokens=1 delims=v." %%a in ('node -v 2^>nul') do set "NODE_MAJOR=%%a"
if %NODE_MAJOR% LSS 18 goto :node_old
exit /b 0

:node_missing
echo.
echo   Node.js is not installed, or this window cannot see it.
echo     1. Install the LTS version from https://nodejs.org
echo        or run:  winget install OpenJS.NodeJS.LTS
echo     2. Close this window and open portfolio.bat again.
echo.
pause
exit /b 1

:node_old
echo.
echo   Your Node.js is too old (version %NODE_MAJOR%). This project needs 18 or newer.
echo   Install the LTS version from https://nodejs.org, then open portfolio.bat again.
echo.
pause
exit /b 1

rem --- runs npm install the first time, and again whenever package.json changed ---
:install_if_needed
if not exist "%ROOT%\node_modules\.portfolio-stamp" goto :do_install
powershell -NoProfile -Command "$s=(Get-Item 'node_modules\.portfolio-stamp').LastWriteTime; foreach($f in 'package.json','package-lock.json'){ if((Test-Path $f) -and ((Get-Item $f).LastWriteTime -gt $s)){ exit 1 } }; exit 0"
if errorlevel 1 goto :do_install
exit /b 0

:do_install
echo.
echo   Installing the packages this site needs. The first time takes a few minutes.
echo.
call npm install --no-audit --no-fund
if errorlevel 1 goto :install_failed
type nul > "%ROOT%\node_modules\.portfolio-stamp"
exit /b 0

:install_failed
echo.
echo   npm install failed. Read the message above.
echo   Check your internet connection, then try menu option 9.
echo.
pause
exit /b 1

rem --- puts a sortable date and time in STAMP, like 20261118-143055 ---
:stamp
set "STAMP="
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%i"
if not defined STAMP set "STAMP=%RANDOM%"
exit /b 0

rem --- copies the project (without node_modules, dist, .git) into _backups\<stamp>-<label>; sets BK ---
:make_backup
call :stamp
set "BK=%ROOT%\_backups\%STAMP%-%~1"
robocopy "%ROOT%" "%BK%" /E /R:2 /W:1 /XD node_modules dist _backups .git /NFL /NDL /NJH /NJS /NP
if errorlevel 8 set "BK="
if not defined BK exit /b 1
exit /b 0
