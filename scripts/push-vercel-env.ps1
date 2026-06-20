param(
  [ValidateSet("development", "preview", "production")]
  [string]$Environment = "production",
  [string]$SourcePath = (Join-Path (Split-Path $PSScriptRoot -Parent) "vercel.env")
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "Vercel CLI is not installed or not available on PATH."
}

$resolvedSource = Resolve-Path -LiteralPath $SourcePath -ErrorAction SilentlyContinue
if (-not $resolvedSource) {
  throw "Could not find env file at '$SourcePath'."
}

Get-Content -LiteralPath $resolvedSource.Path | ForEach-Object {
  $line = $_.Trim()

  if (-not $line -or $line.StartsWith("#")) {
    return
  }

  $equalsIndex = $line.IndexOf("=")
  if ($equalsIndex -lt 1) {
    return
  }

  $name = $line.Substring(0, $equalsIndex).Trim()
  $value = $line.Substring($equalsIndex + 1).Trim()

  if (-not $name -or -not $value) {
    return
  }

  if (
    ($value.StartsWith('"') -and $value.EndsWith('"')) -or
    ($value.StartsWith("'") -and $value.EndsWith("'"))
  ) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  Write-Host "Adding $name to Vercel ($Environment)..."
  $value | & vercel env add $name $Environment
}
