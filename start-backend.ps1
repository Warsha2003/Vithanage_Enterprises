Write-Host "Starting Vithanage Enterprises Backend Server..." -ForegroundColor Green

# Kill any existing node processes on port 5000
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Modules.FileName -match "nodejs" }
foreach ($process in $processes) {
    try {
        Stop-Process -Id $process.Id -Force
        Write-Host "Stopped existing Node.js process: $($process.Id)" -ForegroundColor Yellow
    } catch {
        Write-Host "Failed to stop process $($process.Id): $_" -ForegroundColor Red
    }
}

# Change to the backend directory and start the server
Set-Location -Path "c:\Users\USER\Desktop\sem3\Vithanage_Enterprises\BackEnd"
npm start
