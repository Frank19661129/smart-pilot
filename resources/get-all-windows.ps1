# Get All Windows - PowerShell Script
# Returns all visible windows as JSON

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
}
"@

Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | ForEach-Object {
    $handle = $_.MainWindowHandle
    $length = [Win32]::GetWindowTextLength($handle)
    if ($length -gt 0) {
        $text = New-Object System.Text.StringBuilder -ArgumentList ($length + 1)
        [Win32]::GetWindowText($handle, $text, $text.Capacity) | Out-Null
        $title = $text.ToString()

        if ($title -and [Win32]::IsWindowVisible($handle)) {
            [PSCustomObject]@{
                Title = $title
                ProcessName = $_.ProcessName
                ProcessId = $_.Id
                WindowHandle = $handle.ToInt64()
                Path = $_.Path
            }
        }
    }
} | ConvertTo-Json
