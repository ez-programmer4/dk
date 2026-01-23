# PowerShell script to batch convert single-tenant admin pages to multi-tenant
$pages = @(
    "attendance",
    "controller-earnings",
    "deduction-adjustments",
    "notifications",
    "package-deductions",
    "payments",
    "pending-deposits",
    "permissions",
    "quality",
    "registrar-earnings",
    "settings",
    "subscription-packages",
    "teacher-changes",
    "teacher-durations",
    "users",
    "ustaz"
)

foreach ($page in $pages) {
    $sourcePath = "src/app/admin/$page/page.tsx"
    $destPath = "src/app/admin/[schoolSlug]/$page/page.tsx"

    if (Test-Path $sourcePath) {
        # Create destination directory if it doesn't exist
        $destDir = Split-Path $destPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }

        # Copy the file
        Copy-Item $sourcePath $destPath -Force
        Write-Host "Copied $page page to multi-tenant structure"

        # Add schoolSlug parameter extraction for client components
        $content = Get-Content $destPath
        if ($content -match '"use client"') {
            # This is a client component, add useParams import and extraction
            $content = $content -replace 'import \{ useSession \} from "next-auth/react";', 'import { useSession } from "next-auth/react";`nimport { useParams } from "next/navigation";'
            $content = $content -replace 'export default function (\w+)Page\(\) \{', 'export default function `$1Page() {`n  const params = useParams();`n  const schoolSlug = params.schoolSlug as string;`n'
            Set-Content $destPath $content
            Write-Host "Updated client component for $page page"
        } else {
            # This is a server component, add params to function signature
            $content = $content -replace 'export default function (\w+)Page\(\)', 'export default function `$1Page({ params }: { params: { schoolSlug: string } })'
            Set-Content $destPath $content
            Write-Host "Updated server component for $page page"
        }
    } else {
        Write-Host "Page $page not found, skipping..."
    }
}

Write-Host "Batch page conversion completed!"
