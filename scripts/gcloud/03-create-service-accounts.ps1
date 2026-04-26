param(
  [switch]$Apply
)

. (Join-Path $PSScriptRoot "00-config.ps1")

if (-not (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  throw "Project '$($script:EixoOneConfig.ProjectId)' is not accessible. Create or grant access before managing service accounts."
}

$existingAccounts = @{}
$accountListJson = & $script:GcloudCommand iam service-accounts list --project $script:EixoOneConfig.ProjectId --format=json 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($accountListJson | Out-String))) {
  ($accountListJson | ConvertFrom-Json) | ForEach-Object {
    $existingAccounts[$_.email] = $true
  }
}

$policy = Get-ProjectIamPolicy -ProjectId $script:EixoOneConfig.ProjectId
$bindings = @()
if ($null -ne $policy -and $null -ne $policy.bindings) {
  $bindings = $policy.bindings
}

foreach ($definition in $script:ServiceAccountDefinitions) {
  $email = Get-ServiceAccountEmail -Name $definition.Name
  $member = "serviceAccount:{0}" -f $email

  if (-not $existingAccounts.ContainsKey($email)) {
    if (-not $Apply) {
      Write-Host ("[plan] Create service account {0}" -f $email)
    }
    else {
      Write-Step ("Creating service account {0}" -f $email)
      & $script:GcloudCommand iam service-accounts create $definition.Name `
        --project $script:EixoOneConfig.ProjectId `
        --display-name $definition.Name `
        --description $definition.Description

      if ($LASTEXITCODE -ne 0) {
        throw "Failed to create service account $email."
      }

      $existingAccounts[$email] = $true
    }
  }
  else {
    Write-Host ("[ok] Service account exists: {0}" -f $email)
  }

  foreach ($role in $definition.Roles) {
    $alreadyBound = $bindings | Where-Object {
      $_.role -eq $role -and $null -ne $_.members -and $member -in $_.members
    }

    if ($alreadyBound) {
      Write-Host ("[ok] {0} already has {1}" -f $email, $role)
      continue
    }

    if (-not $Apply) {
      Write-Host ("[plan] Grant {0} to {1}" -f $role, $email)
      continue
    }

    Write-Step ("Granting {0} to {1}" -f $role, $email)
    & $script:GcloudCommand projects add-iam-policy-binding $script:EixoOneConfig.ProjectId `
      --member $member `
      --role $role `
      --condition=None `
      --quiet 1>$null

    if ($LASTEXITCODE -ne 0) {
      throw "Failed to grant $role to $email."
    }
  }
}
