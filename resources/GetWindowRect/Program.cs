using System;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace GetWindowRect
{
    class Program
    {
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        static int Main(string[] args)
        {
            try
            {
                // Check arguments
                if (args.Length == 0)
                {
                    Console.Error.WriteLine("Usage: GetWindowRect.exe <windowHandle>");
                    return 1;
                }

                // Parse window handle
                if (!long.TryParse(args[0], out long handleValue))
                {
                    var errorResult = new
                    {
                        success = false,
                        error = "Invalid window handle format"
                    };
                    Console.WriteLine(JsonSerializer.Serialize(errorResult));
                    return 1;
                }

                IntPtr hWnd = new IntPtr(handleValue);

                // Get window rect
                if (!GetWindowRect(hWnd, out RECT rect))
                {
                    var errorResult = new
                    {
                        success = false,
                        error = "Failed to get window rect"
                    };
                    Console.WriteLine(JsonSerializer.Serialize(errorResult));
                    return 1;
                }

                // Output JSON result
                var result = new
                {
                    success = true,
                    left = rect.Left,
                    top = rect.Top,
                    right = rect.Right,
                    bottom = rect.Bottom,
                    width = rect.Right - rect.Left,
                    height = rect.Bottom - rect.Top
                };

                Console.WriteLine(JsonSerializer.Serialize(result));
                return 0;
            }
            catch (Exception ex)
            {
                var errorResult = new
                {
                    success = false,
                    error = ex.Message
                };
                Console.WriteLine(JsonSerializer.Serialize(errorResult));
                return 1;
            }
        }
    }
}
