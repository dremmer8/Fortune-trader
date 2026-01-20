@echo off
echo ========================================
echo   Deploying Signature Fix
echo ========================================
echo.

echo This will deploy the fixed Cloud Function that properly verifies signatures.
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo [1/4] Checking Firebase CLI...
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Firebase CLI not found!
    echo.
    echo Install it with: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)
echo Firebase CLI found!

echo.
echo [2/4] Checking Firebase login...
firebase login:list
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Not logged in to Firebase!
    echo.
    echo Run: firebase login
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] Deploying Cloud Functions...
echo This may take a few minutes...
echo.
firebase deploy --only functions --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Deployment failed!
    echo ========================================
    echo.
    echo Check the error message above.
    echo.
    echo Common issues:
    echo - Not logged in: Run "firebase login"
    echo - Wrong project: Run "firebase use fortunetrader-c4841"
    echo - Missing permissions: Check Firebase Console
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Success!
echo ========================================
echo   Cloud Function Updated!
echo ========================================
echo.
echo The signature verification bug has been fixed.
echo.
echo Next steps:
echo 1. Unflag yourself in the admin panel
echo 2. Reload your game
echo 3. Play normally - signatures should now verify correctly!
echo.
echo.
pause
