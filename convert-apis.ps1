# PowerShell script to batch convert single-tenant APIs to multi-tenant
$apis = @(
    "attendance",
    "controller-earnings",
    "deduction-adjustments",
    "notifications",
    "package-deductions",
    "pending-deposits",
    "permissions",
    "quality-review",
    "registrar-earnings",
    "subscription-packages",
    "teacher-changes",
    "teacher-durations"
)

foreach ($api in $apis) {
    $sourcePath = "src/app/api/admin/$api/route.ts"
    $destPath = "src/app/api/admin/[schoolSlug]/$api/route.ts"

    if (Test-Path $sourcePath) {
        # Create destination directory if it doesn't exist
        $destDir = Split-Path $destPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }

        # Copy the file
        Copy-Item $sourcePath $destPath -Force
        Write-Host "Copied $api API to multi-tenant structure"

        # Basic parameter addition (this is a simple replacement, real conversion needs more work)
        $content = Get-Content $destPath -Raw
        $content = $content -replace "export async function (\w+)\(req: NextRequest\) \{", "export async function `$1(req: NextRequest, { params }: { params: { schoolSlug: string } }) {"
        Set-Content $destPath $content

        Write-Host "Updated function signatures for $api API"
    } else {
        Write-Host "API $api not found, skipping..."
    }
}

Write-Host "Batch conversion completed!"
