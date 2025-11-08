# HomeNetAI Frontend Startup Script
Write-Host "Starting HomeNetAI Frontend..." -ForegroundColor Green

# Check if Node.js is installed
if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
    Write-Host "Node.js found. Adding to PATH and starting development server..." -ForegroundColor Yellow
    
    # Add Node.js to PATH for this session
    $env:PATH += ";C:\Program Files\nodejs"
    
    # Now run npm
    npm run dev
} else {
    Write-Host "Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Yellow
    pause
}
