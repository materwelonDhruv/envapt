# Link local packages in the monorepo using npm link
# Run from repository root (where envapt/ envapt-superimg/ envapt-nezlephant/ nezlephant/ exist)

$packages = @("envapt", "envapt-superimg", "envapt-nezlephant", "nezlephant")

Write-Host "Linking local packages..."

# First, create links for top-level packages
Push-Location "envapt"
Write-Host "Linking envapt (global link)"
npm link
Pop-Location

# Link envapt into other packages
Push-Location "envapt-superimg"
Write-Host "Linking envapt into envapt-superimg"
npm link envapt
Pop-Location

Push-Location "envapt-nezlephant"
Write-Host "Linking envapt into envapt-nezlephant"
npm link envapt
Pop-Location

Push-Location "nezlephant"
Write-Host "Linking nezlephant (global link)"
npm link
Pop-Location

Push-Location "envapt-nezlephant"
Write-Host "Linking nezlephant into envapt-nezlephant"
npm link @funeste38/nezlephant
Pop-Location

Write-Host "Linking complete. You may need to run npm install in each package if deps are missing."