param(
  [string]$ServiceName,
  [string]$BaseUrl,
  [int]$TimeoutSec = 30,
  [switch]$Json
)

. (Join-Path $PSScriptRoot "00-config.ps1")

function Get-ServiceUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ResolvedServiceName
  )

  $serviceUrl = & $script:GcloudCommand run services describe $ResolvedServiceName `
    --project $script:EixoOneConfig.ProjectId `
    --region $script:EixoOneConfig.Region `
    --format "value(status.url)" 2>$null

  if ($LASTEXITCODE -ne 0) {
    throw "Unable to resolve Cloud Run service URL for '$ResolvedServiceName'."
  }

  return ($serviceUrl | Select-Object -First 1).Trim().TrimEnd("/")
}

function Invoke-StatusCheck {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [Parameter(Mandatory = $true)]
    [ValidateSet(200, 401)]
    [int]$ExpectedStatusCode
  )

  try {
    $response = Invoke-WebRequest -Uri $Uri -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing
    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Content = $response.Content
    }
  }
  catch {
    $httpResponse = $_.Exception.Response
    if ($null -eq $httpResponse) {
      throw
    }

    $statusCode = [int]$httpResponse.StatusCode
    if ($statusCode -ne $ExpectedStatusCode) {
      throw
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Content = ""
    }
  }
}

$resolvedServiceName = if ([string]::IsNullOrWhiteSpace($ServiceName)) {
  "{0}-api-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
}
else {
  $ServiceName
}

$resolvedBaseUrl = if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  Get-ServiceUrl -ResolvedServiceName $resolvedServiceName
}
else {
  $BaseUrl.Trim().TrimEnd("/")
}

$healthResponse = Invoke-StatusCheck -Uri "$resolvedBaseUrl/health" -ExpectedStatusCode 200
$readyResponse = Invoke-StatusCheck -Uri "$resolvedBaseUrl/ready" -ExpectedStatusCode 200
$meResponse = Invoke-StatusCheck -Uri "$resolvedBaseUrl/v1/me" -ExpectedStatusCode 401

$healthPayload = $healthResponse.Content | ConvertFrom-Json
$readyPayload = $readyResponse.Content | ConvertFrom-Json

$summary = [ordered]@{
  ProjectId = $script:EixoOneConfig.ProjectId
  Region = $script:EixoOneConfig.Region
  ServiceName = $resolvedServiceName
  BaseUrl = $resolvedBaseUrl
  HealthStatusCode = $healthResponse.StatusCode
  HealthStatus = $healthPayload.status
  ReadyStatusCode = $readyResponse.StatusCode
  ReadyStatus = $readyPayload.status
  UnauthorizedMeStatusCode = $meResponse.StatusCode
}

if ($Json) {
  $summary | ConvertTo-Json -Depth 4
  exit 0
}

Write-Step "Cloud Run smoke test summary"
$summary.GetEnumerator() | ForEach-Object {
  Write-Host (" - {0}: {1}" -f $_.Key, $_.Value)
}
