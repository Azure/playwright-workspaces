# deploy-azure.ps1
#
# Builds the proxy-server image in ACR and deploys it to Azure Container
# Instances with a public IP + DNS label. ACI is used (not Container Apps)
# because the HTTP CONNECT method used for HTTPS needs raw TCP passthrough
# on a public endpoint; ACI gives that on any port.
#
# Prereqs: az login
#
# Run:
#   ./deploy-azure.ps1 -ResourceGroup my-rg -ProxyUser usr -ProxyPass '<your-strong-password>'
#
# Optional overrides:
#   -Location <region>      default: existing RG location, else eastus
#   -AcrName <name>         default: pwproxyacr<rand>
#   -AppName <name>         default: pw-proxy
#   -Port <int>             default: 8080
#
# View live container logs:
#   az container logs -g <ResourceGroup> -n <AppName> --follow

param(
  [Parameter(Mandatory=$true)][string]$ResourceGroup,
  [string]$Location      = "",
  [string]$AcrName       = "pwproxyacr$((Get-Random -Maximum 99999))",
  [string]$AppName       = "pw-proxy",
  [int]   $Port          = 8080,
  [Parameter(Mandatory=$true)][string]$ProxyUser,
  [Parameter(Mandatory=$true)][string]$ProxyPass
)

$ErrorActionPreference = "Stop"

$rgExists = az group exists -n $ResourceGroup
if ($rgExists -eq "true") {
  Write-Host "==> Using existing resource group $ResourceGroup"
  if (-not $Location) {
    $Location = az group show -n $ResourceGroup --query location -o tsv
  }
  Write-Host "    (location: $Location)"
} else {
  if (-not $Location) { $Location = "eastus" }
  Write-Host "==> Creating resource group $ResourceGroup in $Location ..."
  az group create -n $ResourceGroup -l $Location | Out-Null
}

Write-Host "==> Creating ACR $AcrName ..."
az acr create -g $ResourceGroup -n $AcrName --sku Basic --admin-enabled true | Out-Null

Write-Host "==> Building image in ACR ..."
az acr build -r $AcrName -t "pw-proxy:latest" . | Out-Null

$acrServer  = az acr show -n $AcrName --query loginServer -o tsv
$acrUser    = az acr credential show -n $AcrName --query username -o tsv
$acrPass    = az acr credential show -n $AcrName --query "passwords[0].value" -o tsv

# Tear down any stale instance with the same name from a previous failed run.
# az writes "not found" to stderr which $ErrorActionPreference=Stop would treat
# as terminating; suppress both streams and rely on $LASTEXITCODE instead.
$existing = & { $ErrorActionPreference = 'Continue'; az container show -g $ResourceGroup -n $AppName 2>&1 | Out-Null; $LASTEXITCODE }
if ($existing -eq 0) {
  Write-Host "==> Removing previous container instance $AppName ..."
  az container delete -g $ResourceGroup -n $AppName --yes | Out-Null
}

# DNS label must be globally unique within the region.
# Derive it deterministically from subscription + RG + app name so re-running
# this script reuses the same FQDN (no need to update .env after each deploy).
$subId   = az account show --query id -o tsv
$hash    = [BitConverter]::ToString(
              [System.Security.Cryptography.SHA1]::Create().ComputeHash(
                  [System.Text.Encoding]::UTF8.GetBytes("$subId|$ResourceGroup|$AppName")
              )
           ).Replace('-', '').Substring(0, 6).ToLower()
$dnsLabel = "$AppName-$hash".ToLower()

Write-Host "==> Deploying ACI $AppName ($dnsLabel) ..."
az container create `
  -g $ResourceGroup `
  -n $AppName `
  --image "$acrServer/pw-proxy:latest" `
  --registry-login-server $acrServer `
  --registry-username $acrUser `
  --registry-password $acrPass `
  --os-type Linux `
  --cpu 1 --memory 1 `
  --ports $Port `
  --ip-address Public `
  --dns-name-label $dnsLabel `
  --environment-variables "PROXY_USER=$ProxyUser" "PORT=$Port" `
  --secure-environment-variables "PROXY_PASS=$ProxyPass" | Out-Null

$fqdn = az container show -g $ResourceGroup -n $AppName --query "ipAddress.fqdn" -o tsv
$ip   = az container show -g $ResourceGroup -n $AppName --query "ipAddress.ip" -o tsv

Write-Host ""
Write-Host "=============================================="
Write-Host " Proxy deployed."
Write-Host " FQDN : $fqdn"
Write-Host " IP   : $ip"
Write-Host " Port : $Port"
Write-Host " User : $ProxyUser"
Write-Host "=============================================="
Write-Host ""
Write-Host "Smoke test:"
Write-Host "  curl.exe -x http://$($ProxyUser):$ProxyPass@$($fqdn):$Port https://example.com -I"
Write-Host ""
Write-Host "Set in your .env:"
Write-Host "  PROXY_SERVER=http://$($fqdn):$Port"
Write-Host "  PROXY_USERNAME=$ProxyUser"
Write-Host "  PROXY_PASSWORD=<the pass you provided>"
