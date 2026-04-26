param(
  [switch]$Apply,
  [string]$ImageTag = "latest",
  [switch]$SkipLocalValidation,
  [switch]$SkipImageBuild,
  [switch]$SkipConfirmation
)

. (Join-Path $PSScriptRoot "00-config.ps1")

if (-not (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  throw "Project '$($script:EixoOneConfig.ProjectId)' is not accessible. Create or grant access before deploying Cloud Run."
}

$repoRoot = Get-RepoRoot
$serviceName = "{0}-api-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
$repositoryName = Get-ArtifactRepositoryName
$imageUri = "{0}-docker.pkg.dev/{1}/{2}/api:{3}" -f `
  $script:EixoOneConfig.Region,
  $script:EixoOneConfig.ProjectId,
  $repositoryName,
  $ImageTag
$serviceAccountEmail = Get-ServiceAccountEmail -Name $serviceName
$corsOrigins = @(
  "https://$($script:EixoOneConfig.ProjectId).web.app",
  "https://$($script:EixoOneConfig.ProjectId).firebaseapp.com",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:18080",
  "http://127.0.0.1:18080",
  "http://localhost:18081",
  "http://127.0.0.1:18081"
) -join ","
$secretBindings = @(
  "FIREBASE_PROJECT_ID=EIXOONE_FIREBASE_PROJECT_ID:latest",
  "APP_ENV=EIXOONE_API_ENV:latest"
) -join ","

if (-not $Apply) {
  Write-Host ("[plan] Validate monorepo in {0}" -f $repoRoot)
  Write-Host ("[plan] Build image {0}" -f $imageUri)
  Write-Host ("[plan] Deploy Cloud Run service {0}" -f $serviceName)
  exit 0
}

if (-not $SkipConfirmation) {
  $confirmation = Read-Host "Confirmar deploy do Cloud Run? Digite DEPLOY para continuar"
  if ($confirmation -ne "DEPLOY") {
    Write-Step "Deploy cancelado com seguranca."
    exit 0
  }
}

Push-Location $repoRoot
try {
  if (-not $SkipLocalValidation) {
    Write-Step "Running local monorepo validation before deploy"
    & npm run validate
    if ($LASTEXITCODE -ne 0) {
      throw "Local validation failed."
    }
  }

  if (-not $SkipImageBuild) {
    $temporaryBuildConfig = [System.IO.Path]::GetTempFileName()
    $buildConfig = @'
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - backend/api_node/Dockerfile
      - -t
      - ${_IMAGE_URI}
      - .
images:
  - ${_IMAGE_URI}
options:
  logging: CLOUD_LOGGING_ONLY
'@

    Set-Content -LiteralPath $temporaryBuildConfig -Value $buildConfig -NoNewline

    Write-Step ("Building container image {0}" -f $imageUri)
    try {
      & $script:GcloudCommand builds submit `
        $repoRoot `
        --project $script:EixoOneConfig.ProjectId `
        --config $temporaryBuildConfig `
        --substitutions ("_IMAGE_URI={0}" -f $imageUri)

      if ($LASTEXITCODE -ne 0) {
        throw "Cloud Build image creation failed."
      }
    }
    finally {
      if (Test-Path $temporaryBuildConfig) {
        Remove-Item -LiteralPath $temporaryBuildConfig -Force
      }
    }
  }
  else {
    Write-Step ("Skipping image build and reusing {0}" -f $imageUri)
  }

  Write-Step ("Deploying Cloud Run service {0}" -f $serviceName)
  $temporaryEnvFile = [System.IO.Path]::GetTempFileName()
  $envFileContent = @"
GOOGLE_CLOUD_PROJECT: "$($script:EixoOneConfig.ProjectId)"
DATA_MODE: "firebase"
CORS_ORIGIN: "$corsOrigins"
LOG_LEVEL: "info"
BODY_LIMIT_BYTES: "1048576"
"@
  Set-Content -LiteralPath $temporaryEnvFile -Value $envFileContent -NoNewline

  try {
  & $script:GcloudCommand run deploy $serviceName `
    --project $script:EixoOneConfig.ProjectId `
    --region $script:EixoOneConfig.Region `
    --platform managed `
    --image $imageUri `
    --service-account $serviceAccountEmail `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 2 `
    --concurrency 80 `
    --timeout 60 `
    --env-vars-file $temporaryEnvFile `
    --set-secrets $secretBindings `
    --quiet
  }
  finally {
    if (Test-Path $temporaryEnvFile) {
      Remove-Item -LiteralPath $temporaryEnvFile -Force
    }
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Cloud Run deployment failed."
  }

  $serviceUrl = & $script:GcloudCommand run services describe $serviceName `
    --project $script:EixoOneConfig.ProjectId `
    --region $script:EixoOneConfig.Region `
    --format "value(status.url)" 2>$null

  Write-Step ("Cloud Run service ready at {0}" -f (($serviceUrl | Select-Object -First 1).Trim()))
}
finally {
  Pop-Location
}
