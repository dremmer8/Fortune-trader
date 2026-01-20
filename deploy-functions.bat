@echo off
echo ========================================
echo Fortune Trader - Deploy Cloud Functions
echo ========================================
echo.

REM Check if in correct directory
if not exist "functions" (
    echo ERROR: functions directory not found!
    echo Make sure you're running this from the project root.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/4] Checking Firebase CLI...
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Firebase CLI not found!
    echo.
    echo Please install it first:
    echo   npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [2/4] Installing function dependencies...
cd functions
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to install dependencies!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Deploying Cloud Functions...
echo This may take 1-2 minutes...
echo.
call firebase deploy --only functions

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo Deployment FAILED!
    echo ========================================
    echo.
    echo Common issues:
    echo  1. Not logged in: Run "firebase login"
    echo  2. Wrong project: Check .firebaserc file
    echo  3. Node.js version: Requires Node 18+
    echo.
    echo For detailed help, see TROUBLESHOOTING.md
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Cloud Functions Deployed
echo ========================================
echo.
echo [4/4] Verification...
echo Listing deployed functions:
call firebase functions:list

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Reload your game in the browser
echo 2. Check console for: "Cloud validation passed"
echo 3. Test anti-cheat by trying to cheat
echo.
echo Your security system is now fully active!
echo.
pause
