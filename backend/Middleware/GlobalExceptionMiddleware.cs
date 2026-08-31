using System.Text.Json;

namespace OppiInnovationApi.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    { _next = next; _logger = logger; }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await _next(ctx); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled: {Msg}", ex.Message);
            ctx.Response.ContentType = "application/json";
            var isDev = ctx.RequestServices.GetService<IWebHostEnvironment>()?.IsDevelopment() == true;
            var code = ex switch {
                UnauthorizedAccessException => 401,
                ArgumentException => 400,
                KeyNotFoundException => 404,
                _ => 500
            };
            ctx.Response.StatusCode = code;
            await ctx.Response.WriteAsync(JsonSerializer.Serialize(new {
                status = code, message = code == 500 ? "Something went wrong" : ex.Message,
                detail = isDev ? ex.ToString() : (string?)null
            }));
        }
    }
}
