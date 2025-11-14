# Backup and restore USER/USERNAME for test runs
$oldUser = $null
$oldUserName = $null
if (Test-Path Env:\USER) { $oldUser = (Get-Item Env:\USER).Value; Remove-Item Env:\USER }
if (Test-Path Env:\USERNAME) { $oldUserName = (Get-Item Env:\USERNAME).Value; Remove-Item Env:\USERNAME }

try {
  Write-Host "Running tests with cleaned env (USER/USERNAME removed)"
  npm test
} finally {
  if ($oldUser -ne $null) { Set-Item Env:\USER $oldUser }
  if ($oldUserName -ne $null) { Set-Item Env:\USERNAME $oldUserName }
  Write-Host "Restored USER/USERNAME"
}
