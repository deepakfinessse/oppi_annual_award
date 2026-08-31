using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OppiInnovationApi.Models;

namespace OppiInnovationApi.Services;

public class JwtService
{
    private readonly InnovationDbContext _db;
    private readonly IConfiguration _config;
    public JwtService(InnovationDbContext db, IConfiguration config) { _db = db; _config = config; }

    public string GenerateAccessToken(User user)
    {
        var key = _config["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new InvalidOperationException("JWT_KEY is missing from configuration.");
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role ?? "USER"),
            new Claim("userId", user.Id.ToString())
        };
        var token = new JwtSecurityToken(
            _config["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation",
            _config["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers",
            claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<string> GenerateRefreshTokenAsync(User user, string? deviceInfo = null)
    {
        var existing = await _db.RefreshTokens.Where(rt => rt.UserId == user.Id && rt.RevokedAt == null).ToListAsync();
        foreach (var rt in existing) rt.RevokedAt = DateTime.UtcNow;
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        _db.RefreshTokens.Add(new RefreshToken { UserId = user.Id, Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(1), CreatedAt = DateTime.UtcNow, DeviceInfo = deviceInfo });
        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<(string access, string refresh)?> RefreshAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens.Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        if (stored == null || stored.RevokedAt != null || DateTime.UtcNow >= stored.ExpiresAt) return null;
        stored.RevokedAt = DateTime.UtcNow;
        var at = GenerateAccessToken(stored.User);
        var rt = await GenerateRefreshTokenAsync(stored.User, stored.DeviceInfo);
        return (at, rt);
    }

    public async Task RevokeAllAsync(int userId)
    {
        var tokens = await _db.RefreshTokens.Where(rt => rt.UserId == userId && rt.RevokedAt == null).ToListAsync();
        foreach (var rt in tokens) rt.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}

public class DomainService
{
    private readonly InnovationDbContext _db;
    public DomainService(InnovationDbContext db) { _db = db; }

    public bool IsAllowed(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return false;
        var domain = email.Split('@')[1].Trim().ToLower();
        return _db.AllowedDomains.Any(x => x.IsActive && x.Domain.ToLower() == domain);
    }
}

public class AuditService
{
    private readonly InnovationDbContext _db;
    public AuditService(InnovationDbContext db) { _db = db; }

    public async Task LogAsync(int? userId, string action, string? entityType = null, int? entityId = null, string? details = null, string? ip = null)
    {
        _db.AuditLogs.Add(new AuditLog { UserId = userId, Action = action, EntityType = entityType,
            EntityId = entityId, Details = details, IpAddress = ip, CreatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();
    }
}

public interface IStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string subFolder, string uniqueName);
    Task DeleteFileAsync(string fileUrl);
}

public class LocalFileStorageService : IStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    public LocalFileStorageService(IWebHostEnvironment env, IConfiguration config) 
    { 
        _env = env; 
        _config = config;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string subFolder, string uniqueName)
    {
        var baseDir = _config["UploadsFolder"] ?? Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
        var uploadsDir = Path.Combine(baseDir, subFolder);
        Directory.CreateDirectory(uploadsDir);
        var filePath = Path.Combine(uploadsDir, uniqueName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        return $"/uploads/{subFolder}/{uniqueName}";
    }

    public Task DeleteFileAsync(string fileUrl)
    {
        var baseDir = _config["UploadsFolder"] ?? Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
        var relativePath = fileUrl.StartsWith("/uploads/") ? fileUrl.Substring("/uploads/".Length) : fileUrl.TrimStart('/');
        var localPath = Path.Combine(baseDir, relativePath);
        if (File.Exists(localPath)) File.Delete(localPath);
        return Task.CompletedTask;
    }
}

public class AzureBlobStorageService : IStorageService
{
    private readonly string _connectionString;
    private readonly string _containerName = "innovation-uploads";

    public AzureBlobStorageService(IConfiguration config)
    {
        _connectionString = config["AzureStorage:ConnectionString"] ?? Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING")!;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string subFolder, string uniqueName)
    {
        var blobServiceClient = new Azure.Storage.Blobs.BlobServiceClient(_connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
        await containerClient.CreateIfNotExistsAsync(Azure.Storage.Blobs.Models.PublicAccessType.Blob);
        
        var blobClient = containerClient.GetBlobClient($"{subFolder}/{uniqueName}");
        using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new Azure.Storage.Blobs.Models.BlobHttpHeaders { ContentType = file.ContentType });
        
        return blobClient.Uri.ToString();
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        try
        {
            var uri = new Uri(fileUrl);
            var blobServiceClient = new Azure.Storage.Blobs.BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
            var blobName = string.Join("", uri.Segments.Skip(2));
            var blobClient = containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync();
        }
        catch { /* Ignore errors on delete */ }
    }
}


