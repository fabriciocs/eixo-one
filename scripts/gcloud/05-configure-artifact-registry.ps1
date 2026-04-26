param(
  [switch]$Apply
)

. (Join-Path $PSScriptRoot "00-config.ps1")

if (-not (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  throw "Project '$($script:EixoOneConfig.ProjectId)' is not accessible. Create or grant access before managing Artifact Registry."
}

$repositoryName = Get-ArtifactRepositoryName
$describeCommandLine = '"{0}" artifacts repositories describe "{1}" --project="{2}" --location="{3}" --format=json >nul 2>nul' -f `
  $script:GcloudExecutablePath,
  $repositoryName,
  $script:EixoOneConfig.ProjectId,
  $script:EixoOneConfig.Region
cmd.exe /d /c $describeCommandLine *> $null
$repoExists = $LASTEXITCODE -eq 0

if (-not $repoExists -and -not $Apply) {
  Write-Host ("[plan] Create Artifact Registry repository {0}" -f $repositoryName)
}
elseif (-not $repoExists -and $Apply) {
  Write-Step ("Creating Artifact Registry repository {0}" -f $repositoryName)
  $repositoryLabels = "app={0},env={1}" -f $script:EixoOneConfig.AppName, $script:EixoOneConfig.Environment
  & $script:GcloudCommand artifacts repositories create $repositoryName `
    --project $script:EixoOneConfig.ProjectId `
    --repository-format=docker `
    --location $script:EixoOneConfig.Region `
    --description ("Docker images da API EixoOne {0}" -f $script:EixoOneConfig.Environment) `
    "--labels=$repositoryLabels"

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create Artifact Registry repository $repositoryName."
  }

  $repoExists = $true
}
else {
  Write-Host ("[ok] Artifact Registry repository exists: {0}" -f $repositoryName)
}

if (-not $repoExists) {
  exit 0
}

$repoPolicyJson = & $script:GcloudCommand artifacts repositories get-iam-policy $repositoryName `
  --project $script:EixoOneConfig.ProjectId `
  --location $script:EixoOneConfig.Region `
  --format=json 2>$null

$bindings = @()
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($repoPolicyJson | Out-String))) {
  $policyObject = $repoPolicyJson | ConvertFrom-Json
  if ($policyObject.PSObject.Properties.Name -contains "bindings" -and $null -ne $policyObject.bindings) {
    $bindings = $policyObject.bindings
  }
}

$repoBindings = @(
  [pscustomobject]@{
    Alias = "ci"
    Role = "roles/artifactregistry.writer"
  },
  [pscustomobject]@{
    Alias = "deploy"
    Role = "roles/artifactregistry.reader"
  }
)

foreach ($binding in $repoBindings) {
  $serviceAccountName = Get-ServiceAccountNameByAlias -Alias $binding.Alias
  $serviceAccountEmail = Get-ServiceAccountEmail -Name $serviceAccountName
  $member = "serviceAccount:{0}" -f $serviceAccountEmail

  $alreadyBound = $bindings | Where-Object {
    $_.role -eq $binding.Role -and $null -ne $_.members -and $member -in $_.members
  }

  if ($alreadyBound) {
    Write-Host ("[ok] {0} already has {1}" -f $serviceAccountEmail, $binding.Role)
    continue
  }

  if (-not $Apply) {
    Write-Host ("[plan] Grant {0} to {1} on repository {2}" -f $binding.Role, $serviceAccountEmail, $repositoryName)
    continue
  }

  Write-Step ("Granting {0} to {1} on {2}" -f $binding.Role, $serviceAccountEmail, $repositoryName)
  & $script:GcloudCommand artifacts repositories add-iam-policy-binding $repositoryName `
    --project $script:EixoOneConfig.ProjectId `
    --location $script:EixoOneConfig.Region `
    --member $member `
    --role $binding.Role `
    --quiet 1>$null

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to grant $($binding.Role) to $serviceAccountEmail on repository $repositoryName."
  }
}
