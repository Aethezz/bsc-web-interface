# PowerShell script to start all services
Write-Host "Starting BSC Web Interface Services..." -ForegroundColor Green

# Start backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run frontend"

# Wait a moment
Start-Sleep -Seconds 2

# Start ML service
Write-Host "Starting ML Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run ml-service"

Write-Host "All services started in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5003" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "ML Service: http://localhost:5002" -ForegroundColor Cyan
