@echo off
echo ========================================
echo   FORCE Deploying Cloud Functions
echo ========================================
echo.
echo This will FORCE Firebase to deploy the updated function
echo by making a small change to trigger redeployment.
echo.
pause

echo.
echo [1/5] Making a small change to force rebuild...
cd functions
echo. >> validateSubmission.js
echo // Forced rebuild at %date% %time% >> validateSubmission.js
cd ..
echo Done!

echo.
echo [2/5] Deleting Firebase cache...
if exist .firebase (
    rmdir /s /q .firebase
    echo Cache deleted!
) else (
    echo No cache to delete.
)

echo.
echo [3/5] Checking which project we're using...
firebase use

echo.
echo [4/5] Deploying with FORCE flag...
echo This may take 2-5 minutes...
echo.
firebase deploy --only functions --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Deployment failed!
    echo ========================================
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Cleaning up the forced change...
cd functions
rem Remove the last two lines we added
powershell -Command "(Get-Content validateSubmission.js | Select-Object -SkipLast 2) | Set-Content validateSubmission.js"
cd ..

echo.
echo ========================================
echo   SUCCESS! Function Deployed!
echo ========================================
echo.
echo The Cloud Function is now updated with the signature fix.
echo.
echo NEXT STEPS:
echo 1. Open admin.html and UNFLAG yourself
echo 2. Clear your local security state (see below)
echo 3. Reload the game and test
echo.
echo To clear security state, run this in browser console:
echo   localStorage.removeItem('fortuneTrader_securityState');
echo   localStorage.removeItem('fortuneTrader_transactionLog');
echo   location.reload();
echo.
pause
