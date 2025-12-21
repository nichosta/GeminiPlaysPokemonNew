# Phase 2: Extract addresses from linker map for task functions
# Extracts all Task_ and AnimTask_ prefixed functions from the linker map

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mapPath = "c:\repositories\New GemPP\pokeemerald\pokeemerald.map"
$outputPath = Join-Path (Split-Path $scriptDir -Parent) "src\constants\taskFunctions.ts"

# Extract all task-related symbols from linker map
Write-Host "Loading linker map and extracting task symbols..."
$results = @{}
Get-Content $mapPath | ForEach-Object {
    if ($_ -match '^\s+0x([0-9a-f]{16})\s+(\w+)\s*$') {
        $addr = $matches[1]
        $name = $matches[2]
        # Include Task_ prefix, AnimTask_ prefix, or known task functions
        if ($name -like "Task_*" -or $name -like "AnimTask_*" -or $name -eq "TaskDummy") {
            $results[$name] = "0x$addr"
        }
    }
}
Write-Host "Found $($results.Count) task-related symbols"

# Generate TypeScript file
$tsContent = @"
/**
 * Task function address lookup table
 * Generated from pokeemerald source and linker map
 * 
 * Maps function pointer addresses to human-readable function names.
 * Used to identify active game tasks for menu/state detection.
 */

export const TASK_FUNCTIONS: Map<number, string> = new Map([
"@

foreach ($entry in $results.GetEnumerator() | Sort-Object Name) {
    # Convert hex string to number for the map key
    $tsContent += "  [$($entry.Value), `"$($entry.Key)`"],`n"
}

$tsContent += @"
]);

/**
 * Reverse lookup: function name to address
 */
export const TASK_ADDRESSES: Map<string, number> = new Map([
"@

foreach ($entry in $results.GetEnumerator() | Sort-Object Name) {
    $tsContent += "  [`"$($entry.Key)`", $($entry.Value)],`n"
}

$tsContent += @"
]);

/**
 * Check if a function address corresponds to a known task function
 */
export function getTaskFunctionName(address: number): string | null {
  return TASK_FUNCTIONS.get(address) ?? null;
}

/**
 * Get the address of a task function by name
 */
export function getTaskFunctionAddress(name: string): number | null {
  return TASK_ADDRESSES.get(name) ?? null;
}
"@

# Ensure output directory exists
$outputDir = Split-Path $outputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Write output
$tsContent | Out-File -FilePath $outputPath -Encoding UTF8
Write-Host "Generated $outputPath"
Write-Host "Total entries: $($results.Count)"
