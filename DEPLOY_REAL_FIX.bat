@echo off
echo ========================================
echo   Deploying REAL Signature Fix
echo ========================================
echo.
echo This deploys the corrected signature verification.
echo.
echo THE BUG: Server was pre-hashing data before verification
echo THE FIX: Pass raw data to crypto.verify (like WebCrypto does)
echo.
pause

echo.
echo [1/2] Deploying to Firebase...
echo This may take 2-5 minutes...
echo.

firebase deploy --only functions --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Deployment failed!
    echo ========================================
    echo.
    echo Make sure you're logged in: firebase login
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Real Fix Deployed!
echo ========================================
echo.
echo The signature verification now works correctly:
echo - Client signs RAW data with WebCrypto
echo - Server verifies RAW data with crypto.verify
echo - Both use SHA-256 hashing internally
echo.
echo NEXT STEPS (IMPORTANT):
echo.
echo 1. UNFLAG yourself in admin.html
echo    - Open admin.html
echo    - Click the Unflag button
echo.
echo 2. CLEAR your signing keys (browser console F12):
echo    localStorage.removeItem('fortuneTrader_securityState');
echo    localStorage.removeItem('fortuneTrader_transactionLog');
echo    localStorage.removeItem('fortuneTrader_signingKeys');
echo    location.reload();
echo.
echo 3. TEST the game:
echo    - Make a trade
echo    - Check console for "Cloud validation passed"
echo.
pause
