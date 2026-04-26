param(
  [switch]$Apply
)

. (Join-Path $PSScriptRoot "00-config.ps1")

if (-not (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  throw "Project '$($script:EixoOneConfig.ProjectId)' is not accessible. Create or grant access before managing secrets."
}

$existingSecrets = @{}
$secretListJson = & $script:GcloudCommand secrets list --project $script:EixoOneConfig.ProjectId --format=json 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($secretListJson | Out-String))) {
  ($secretListJson | ConvertFrom-Json) | ForEach-Object {
    if ($_.PSObject.Properties.Name -contains "name" -and -not [string]::IsNullOrWhiteSpace($_.name)) {
      $existingSecrets[$_.name] = $true
      $existingSecrets[(Split-Path $_.name -Leaf)] = $true
    }
  }
}

foreach ($secret in $script:SecretDefinitions) {
  if (-not $existingSecrets.ContainsKey($secret.Name)) {
    if (-not $Apply) {
      Write-Host ("[plan] Create secret {0}" -f $secret.Name)
    }
    else {
      Write-Step ("Creating secret {0}" -f $secret.Name)
      $secretLabels = "app={0},env={1}" -f $script:EixoOneConfig.AppName, $script:EixoOneConfig.Environment
      & $script:GcloudCommand secrets create $secret.Name `
        --project $script:EixoOneConfig.ProjectId `
        --replication-policy="automatic" `
        "--labels=$secretLabels"

      if ($LASTEXITCODE -ne 0) {
        throw "Failed to create secret $($secret.Name)."
      }

      $existingSecrets[$secret.Name] = $true
    }
  }
  else {
    Write-Host ("[ok] Secret exists: {0}" -f $secret.Name)
  }

  if (-not $existingSecrets.ContainsKey($secret.Name)) {
    continue
  }

  $policyJson = & $script:GcloudCommand secrets get-iam-policy $secret.Name --project $script:EixoOneConfig.ProjectId --format=json 2>$null
  $bindings = @()
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($policyJson | Out-String))) {
    $policyObject = $policyJson | ConvertFrom-Json
    if ($policyObject.PSObject.Properties.Name -contains "bindings" -and $null -ne $policyObject.bindings) {
      $bindings = $policyObject.bindings
    }
  }

  foreach ($alias in $secret.Access) {
    $serviceAccountName = Get-ServiceAccountNameByAlias -Alias $alias
    $serviceAccountEmail = Get-ServiceAccountEmail -Name $serviceAccountName
    $member = "serviceAccount:{0}" -f $serviceAccountEmail
    $role = "roles/secretmanager.secretAccessor"

    $alreadyBound = $bindings | Where-Object {
      $_.role -eq $role -and $null -ne $_.members -and $member -in $_.members
    }

    if ($alreadyBound) {
      Write-Host ("[ok] {0} already has access to {1}" -f $serviceAccountEmail, $secret.Name)
      continue
    }

    if (-not $Apply) {
      Write-Host ("[plan] Grant {0} access to {1}" -f $serviceAccountEmail, $secret.Name)
      continue
    }

    Write-Step ("Granting {0} access to {1}" -f $serviceAccountEmail, $secret.Name)
    & $script:GcloudCommand secrets add-iam-policy-binding $secret.Name `
      --project $script:EixoOneConfig.ProjectId `
      --member $member `
      --role $role `
      --quiet 1>$null

    if ($LASTEXITCODE -ne 0) {
      throw "Failed to grant secret access for $serviceAccountEmail on $($secret.Name)."
    }
  }
}
