using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

class WindowInfo
{
    public string Title { get; set; }
    public string ProcessName { get; set; }
    public int ProcessId { get; set; }
    public long WindowHandle { get; set; }
    public string Path { get; set; }
}

class Program
{
    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    private static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    static void Main(string[] args)
    {
        var windows = new List<WindowInfo>();

        EnumWindows((hWnd, lParam) =>
        {
            if (!IsWindowVisible(hWnd))
                return true;

            int length = GetWindowTextLength(hWnd);
            if (length == 0)
                return true;

            StringBuilder text = new StringBuilder(length + 1);
            GetWindowText(hWnd, text, text.Capacity);

            string title = text.ToString();
            if (string.IsNullOrWhiteSpace(title))
                return true;

            uint processId;
            GetWindowThreadProcessId(hWnd, out processId);

            try
            {
                var process = Process.GetProcessById((int)processId);

                windows.Add(new WindowInfo
                {
                    Title = title,
                    ProcessName = process.ProcessName,
                    ProcessId = (int)processId,
                    WindowHandle = hWnd.ToInt64(),
                    Path = GetProcessPath(process)
                });
            }
            catch
            {
                // Process might have exited, skip it
            }

            return true;
        }, IntPtr.Zero);

        string json = JsonSerializer.Serialize(windows);
        Console.WriteLine(json);
    }

    static string GetProcessPath(Process process)
    {
        try
        {
            return process.MainModule?.FileName ?? "";
        }
        catch
        {
            return "";
        }
    }
}
