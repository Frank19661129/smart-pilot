using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

class Program
{
    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    private const int SW_RESTORE = 9;
    private const int SW_SHOW = 5;

    static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.Error.WriteLine("Usage: ActivateWindow.exe <windowHandle>");
            return 1;
        }

        if (!long.TryParse(args[0], out long handleValue))
        {
            Console.Error.WriteLine("Error: Invalid window handle");
            return 1;
        }

        try
        {
            IntPtr hWnd = new IntPtr(handleValue);

            // Check if window is valid
            if (!IsWindowVisible(hWnd))
            {
                Console.Error.WriteLine("Error: Window is not visible");
                return 1;
            }

            // If window is minimized, restore it
            if (IsIconic(hWnd))
            {
                ShowWindow(hWnd, SW_RESTORE);
            }
            else
            {
                ShowWindow(hWnd, SW_SHOW);
            }

            // Bring window to foreground
            if (SetForegroundWindow(hWnd))
            {
                Console.WriteLine($"{{\"success\": true, \"windowHandle\": {handleValue}}}");
                return 0;
            }
            else
            {
                Console.Error.WriteLine("Error: Failed to activate window");
                return 1;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            return 1;
        }
    }
}
