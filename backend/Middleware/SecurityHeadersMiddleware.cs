using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace OppiInnovationApi.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Prevent clickjacking
        context.Response.Headers.Append("X-Frame-Options", "DENY");

        // Prevent MIME-sniffing
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

        // Control referrer information
        context.Response.Headers.Append("Referrer-Policy", "no-referrer-when-downgrade");

        // Strict Content Security Policy for API (none by default for APIs except for connections)
        context.Response.Headers.Append("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");

        // Disable unnecessary browser features
        context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

        // Enable XSS protection filter
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");

        // Instruct search engines not to index or follow
        context.Response.Headers.Append("X-Robots-Tag", "noindex, nofollow");

        await _next(context);
    }
}
