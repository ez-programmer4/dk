# PowerShell script to fix Next.js async route parameters

$files = Get-ChildItem -Path "src/app/api" -Filter "route.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Fix parameter type declarations
    $content = $content -replace '\{ params \}: \{ params: \{ ([^}]+) \} \}', '{ params }: { params: Promise<{ $1 }> }'

    # Add await for params where used
    $content = $content -replace 'const \{ ([^}]+) \} = params;', 'const resolvedParams = await params;' + "`n    const { `$1 } = resolvedParams;"

    # Fix direct params.id usage
    $content = $content -replace 'params\.([a-zA-Z_][a-zA-Z0-9_]*)', 'resolvedParams.$1'

    Set-Content $file.FullName $content
}

Write-Host "Fixed async params in $($files.Count) route files"
