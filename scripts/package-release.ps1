param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseDirectory = Join-Path $projectRoot 'releases'
New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
$releasePath = Join-Path $releaseDirectory ('psu-attendance-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
$manifestPath = Join-Path $projectRoot 'public/build/manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'Build production assets first: npm run build' }
$archive = [IO.Compression.ZipFile]::Open($releasePath, [IO.Compression.ZipArchiveMode]::Create)
$entryNames = [Collections.Generic.List[string]]::new()
function Add-ReleaseFile([string]$sourcePath, [string]$entryName) {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $sourcePath, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $entryNames.Add($entryName)
}
try {
    # Allow only application source and built assets; never traverse storage or junctions.
    foreach ($directory in @('app', 'config', 'routes', 'resources', 'database/migrations', 'public/build', 'public/images')) {
        $absoluteDirectory = Join-Path $projectRoot $directory
        if (-not (Test-Path -LiteralPath $absoluteDirectory)) { continue }
        $pending = [Collections.Generic.Queue[string]]::new()
        $pending.Enqueue($absoluteDirectory)
        while ($pending.Count -gt 0) {
            foreach ($item in Get-ChildItem -LiteralPath $pending.Dequeue() -Force) {
                if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
                if ($item.PSIsContainer) { $pending.Enqueue($item.FullName); continue }
                $entryName = $item.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
                Add-ReleaseFile $item.FullName $entryName
            }
        }
    }
    foreach ($relativePath in @('artisan', 'composer.json', 'composer.lock', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', '.env.production.example', 'DEPLOYMENT.md', 'DEPLOYMENT_READINESS.md', 'bootstrap/app.php', 'bootstrap/providers.php')) {
        $sourcePath = Join-Path $projectRoot $relativePath
        if (Test-Path -LiteralPath $sourcePath) { Add-ReleaseFile $sourcePath $relativePath }
    }
    foreach ($item in Get-ChildItem -LiteralPath (Join-Path $projectRoot 'public') -File -Force) {
        if ($item.Name -eq 'hot') { continue }
        Add-ReleaseFile $item.FullName ('public/' + $item.Name)
    }
    foreach ($directory in @('bootstrap/cache', 'storage/app/private', 'storage/app/public', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/logs')) {
        $entry = $archive.CreateEntry($directory + '/.gitignore')
        $writer = [IO.StreamWriter]::new($entry.Open())
        try { $writer.Write("*" + [Environment]::NewLine + "!.gitignore" + [Environment]::NewLine) } finally { $writer.Dispose() }
    }
    if ($entryNames | Where-Object { $_ -match '(^|/)\.env$|^public/hot$|^public/storage/|^vendor/|^node_modules/|\.sqlite$|^storage/' }) { throw 'Unexpected development or private file in release' }
} finally {
    $archive.Dispose()
}
$verification = [IO.Compression.ZipFile]::OpenRead($releasePath)
try {
    foreach ($required in @('public/build/manifest.json', 'public/.htaccess', '.env.production.example', 'bootstrap/app.php', 'artisan', 'composer.lock')) {
        if (-not $verification.GetEntry($required)) { throw ('Missing release file: ' + $required) }
    }
    Write-Output ('Release verified: ' + $verification.Entries.Count + ' entries')
} finally { $verification.Dispose() }
$hash = (Get-FileHash -LiteralPath $releasePath -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($releasePath + '.sha256', $hash + '  ' + [IO.Path]::GetFileName($releasePath) + [Environment]::NewLine)
Write-Output $releasePath
Write-Output ('SHA256: ' + $hash)