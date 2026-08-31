using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace OppiInnovationApi.Services;

public interface ICaptchaService
{
    (string id, string svgBase64) GenerateCaptcha();
    Task<bool> ValidateCaptchaAsync(string? id, string? answer);
}

public class CaptchaService : ICaptchaService
{
    private readonly IConfiguration _config;
    private static readonly HttpClient _httpClient = new();

    public CaptchaService(IConfiguration config)
    {
        _config = config;
    }

    public (string id, string svgBase64) GenerateCaptcha()
    {
        // Google reCAPTCHA is loaded on the client side, so we don't need to generate anything.
        // Returning a dummy response in case this legacy endpoint is called.
        return ("recaptcha", "");
    }

    public async Task<bool> ValidateCaptchaAsync(string? id, string? answer)
    {
        if (string.IsNullOrWhiteSpace(answer))
        {
            return false;
        }

        var secretKey = _config["ReCaptcha:SecretKey"] 
                        ?? Environment.GetEnvironmentVariable("RECAPTCHA_SECRET_KEY") 
                        ?? "6LcGZlgtAAAAAOsIS0MCKTyUDeep3WHVZz-YIi2n"; // Default fallback

        try
        {
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("secret", secretKey),
                new KeyValuePair<string, string>("response", answer)
            });

            var response = await _httpClient.PostAsync("https://www.google.com/recaptcha/api/siteverify", content);
            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);
            
            if (doc.RootElement.TryGetProperty("success", out var successProp))
            {
                return successProp.GetBoolean();
            }

            return false;
        }
        catch
        {
            return false;
        }
    }
}
