param()

Write-Host "🔧 Bootstrapping monorepo..."
# Nettoyage node_modules
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }

# Install root deps
npm install

Write-Host "🔗 Linking local packages..."
# Install local envapt into consumers via no-save file install
npm install --no-save "D:\fork\envapt"

Write-Host "🧪 Running tests in envapt package..."
$envaptDir = "D:\fork\envapt"
if (Test-Path $envaptDir) {
  Push-Location $envaptDir
  if (Test-Path '.\scripts\run-tests-clean.ps1') {
    pwsh .\scripts\run-tests-clean.ps1
  } else {
    npm test
  }
  Pop-Location
} else {
  Write-Host "envapt package not found at $envaptDir"
}
