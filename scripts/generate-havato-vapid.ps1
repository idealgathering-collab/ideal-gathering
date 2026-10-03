param()
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This helper requires Windows user-bound DPAPI encryption.' }
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root 'env/.env.vapid.local'
if (Test-Path -LiteralPath $destination) { throw 'A retained keypair already exists. Do not rotate it automatically.' }
Push-Location $root
try {
    $generated = & node -e "process.stdout.write(JSON.stringify(require('web-push').generateVAPIDKeys()))"
    if ($LASTEXITCODE -ne 0) { throw 'VAPID generation failed.' }
    $keys = $generated | ConvertFrom-Json
    $sealed = [pscustomobject]@{
        PublicKey = $keys.publicKey
        PrivateKey = ConvertTo-SecureString -String $keys.privateKey -AsPlainText -Force
    }
    $sealed | Export-Clixml -LiteralPath $destination
    Write-Output 'VAPID pair generated; private key encrypted for this Windows user in ignored env/.env.vapid.local. No key values printed.'
} finally {
    $generated = $null
    $keys = $null
    $sealed = $null
    Pop-Location
}
