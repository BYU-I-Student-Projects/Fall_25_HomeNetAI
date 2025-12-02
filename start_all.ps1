# Start both frontend and backend servers concurrently

Write-Host "Starting HomeNetAI servers..." -ForegroundColor Green

# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; python backend/start_backend.py"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Starting Frontend Server...' -ForegroundColor Cyan; npm run dev"

Write-Host "`nServers are starting in separate windows..." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nClose the server windows to stop the servers." -ForegroundColor Gray
