# PowerShell script to activate the virtual environment and run the FastAPI backend
# This script assumes the .venv is located under the backend directory.

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath = Join-Path $projectRoot "backend\.venv"

if (Test-Path $venvPath) {
    Write-Host "Activating virtual environment at $venvPath"
    & "$venvPath\Scripts\Activate.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to activate virtual environment"
        exit 1
    }
} else {
    Write-Error "Virtual environment not found at $venvPath"
    exit 1
}

# Ensure dependencies are installed (optional step)
Write-Host "Installing dependencies..."
pip install -r "$projectRoot\requirements.txt"

# Run the FastAPI app with uvicorn
Write-Host "Starting FastAPI server..."
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
