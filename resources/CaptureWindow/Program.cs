using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;

class WindowCapture
{
    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    private static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;

        public int Width => Right - Left;
        public int Height => Bottom - Top;
    }

    private const uint PW_RENDERFULLCONTENT = 0x00000002;

    static int Main(string[] args)
    {
        if (args.Length < 1)
        {
            Console.Error.WriteLine("Usage: CaptureWindow.exe <windowHandle> [outputPath]");
            return 1;
        }

        if (!long.TryParse(args[0], out long handleValue))
        {
            Console.Error.WriteLine("Error: Invalid window handle");
            return 1;
        }

        IntPtr hWnd = new IntPtr(handleValue);

        // Check if window is valid and visible
        if (!IsWindowVisible(hWnd))
        {
            Console.Error.WriteLine("Error: Window is not visible");
            return 1;
        }

        try
        {
            // Get window rectangle
            if (!GetWindowRect(hWnd, out RECT rect))
            {
                Console.Error.WriteLine("Error: Failed to get window dimensions");
                return 1;
            }

            int width = rect.Width;
            int height = rect.Height;

            if (width <= 0 || height <= 0)
            {
                Console.Error.WriteLine("Error: Invalid window dimensions");
                return 1;
            }

            // Create bitmap
            using (Bitmap bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb))
            {
                using (Graphics graphics = Graphics.FromImage(bitmap))
                {
                    IntPtr hdc = graphics.GetHdc();

                    try
                    {
                        // Capture window content
                        if (!PrintWindow(hWnd, hdc, PW_RENDERFULLCONTENT))
                        {
                            Console.Error.WriteLine("Error: Failed to capture window");
                            return 1;
                        }
                    }
                    finally
                    {
                        graphics.ReleaseHdc(hdc);
                    }
                }

                // Determine output path
                string outputPath;
                if (args.Length >= 2)
                {
                    outputPath = args[1];
                }
                else
                {
                    // Use temp directory
                    string tempDir = Path.GetTempPath();
                    string fileName = $"window_{handleValue}_{DateTime.Now:yyyyMMdd_HHmmss}.png";
                    outputPath = Path.Combine(tempDir, fileName);
                }

                // Ensure directory exists
                string? directory = Path.GetDirectoryName(outputPath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // Save screenshot
                bitmap.Save(outputPath, ImageFormat.Png);

                // Return JSON result
                var result = new
                {
                    success = true,
                    windowHandle = handleValue,
                    outputPath = outputPath,
                    width = width,
                    height = height
                };

                string json = JsonSerializer.Serialize(result);
                Console.WriteLine(json);
                return 0;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            return 1;
        }
    }
}
