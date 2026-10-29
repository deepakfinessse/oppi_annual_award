using System.IO;
using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MimeKit;
using OppiInnovationApi.Models;

namespace OppiInnovationApi.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<EmailService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public EmailService(
        IConfiguration config, 
        IWebHostEnvironment env, 
        ILogger<EmailService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _config = config;
        _env = env;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task LogEmailAuditAsync(int? userId, string action, string? entityType, int? entityId, string details)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<InnovationDbContext>();
            db.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType ?? "Email",
                EntityId = entityId,
                Details = details,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log email audit to database.");
        }
    }

    private string? ResolveLogoPath()
    {
        try
        {
            var uploadsFolder = _config["UploadsFolder"];
            if (!string.IsNullOrEmpty(uploadsFolder))
            {
                var candidate = Path.Combine(uploadsFolder, "Oppi-logo.png");
                if (File.Exists(candidate)) return candidate;
            }

            if (!string.IsNullOrEmpty(_env.WebRootPath))
            {
                var candidate = Path.Combine(_env.WebRootPath, "uploads", "Oppi-logo.png");
                if (File.Exists(candidate)) return candidate;
            }

            if (!string.IsNullOrEmpty(_env.ContentRootPath))
            {
                var candidate1 = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "Oppi-logo.png");
                var candidate2 = Path.Combine(_env.ContentRootPath, "uploads", "Oppi-logo.png");
                if (File.Exists(candidate1)) return candidate1;
                if (File.Exists(candidate2)) return candidate2;
            }

            var baseDir = AppContext.BaseDirectory;
            var candBase1 = Path.Combine(baseDir, "wwwroot", "uploads", "Oppi-logo.png");
            var candBase2 = Path.Combine(baseDir, "uploads", "Oppi-logo.png");
            if (File.Exists(candBase1)) return candBase1;
            if (File.Exists(candBase2)) return candBase2;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not resolve physical logo path for email, falling back to embedded resource or public URL.");
        }
        return null;
    }

    private byte[]? GetLogoBytes()
    {
        try
        {
            var logoPath = ResolveLogoPath();
            if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
            {
                return File.ReadAllBytes(logoPath);
            }

            var assembly = typeof(EmailService).Assembly;
            using var stream = assembly.GetManifestResourceStream("Oppi-logo.png");
            if (stream != null)
            {
                using var ms = new MemoryStream();
                stream.CopyTo(ms);
                return ms.ToArray();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load logo bytes for email.");
        }
        return null;
    }

    private string BuildEmailHtml(string bodyContent, string logoSrc)
    {
        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>OPPI Annual Awards</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;"">
    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #f7f7f7; padding: 20px 0;"">
        <tr>
            <td align=""center"">
                <!-- Main Container -->
                <table role=""presentation"" width=""600"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: 600px; max-width: 600px;"">
                    <!-- Header -->
                    <tr>
                        <td align=""center"" style=""background-color: #ebf5f7; padding: 30px 20px; border-bottom: 1px solid #e1edf0;"">
                            <img src=""{logoSrc}"" height=""65"" alt=""OPPI Logo"" style=""display: block; border: 0; outline: none; text-decoration: none; height: 65px; width: auto; max-width: 220px;"" />
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style=""padding: 40px 40px 30px 40px; color: #222222; font-size: 15px; line-height: 1.6; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
                            {bodyContent}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align=""center"" style=""background: linear-gradient(90deg, #3dc5db, #2db4cc); background-color: #3dc5db; padding: 20px; color: #222222; font-size: 13px; font-weight: 500; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
                            &copy; OPPI 2026. All rights reserved
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }

    private async Task SendMailInternalAsync(
        string recipientEmail, 
        string recipientName, 
        string subject, 
        string plainTextBody, 
        string htmlContent,
        int? userId = null,
        int? entityId = null,
        string? entityType = null,
        string? actionSuccess = null,
        string? actionFailure = null)
    {
        var smtpSection = _config.GetSection("SmtpSettings");
        var host = smtpSection["Server"] ?? "smtp.gmail.com";
        var portStr = smtpSection["Port"] ?? "587";
        var enableSslStr = smtpSection["EnableSsl"] ?? "true";
        var username = smtpSection["Username"] ?? "smtpindiaoppi@gmail.com";
        var password = smtpSection["Password"] ?? "jafkaniynuahfkbe";
        var senderEmail = smtpSection["SenderEmail"] ?? "smtpindiaoppi@gmail.com";
        var senderName = smtpSection["SenderName"] ?? "OPPI Annual Awards";

        int port = int.TryParse(portStr, out var p) ? p : 587;
        bool enableSsl = !bool.TryParse(enableSslStr, out var ssl) || ssl;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        if (string.IsNullOrWhiteSpace(recipientName))
        {
            message.To.Add(MailboxAddress.Parse(recipientEmail));
        }
        else
        {
            message.To.Add(new MailboxAddress(recipientName, recipientEmail));
        }
        message.Subject = subject;

        var builder = new BodyBuilder
        {
            TextBody = plainTextBody
        };

        var publicLogoUrl = _config["LogoUrl"] ?? "https://oppi.nivyam.com/uploads/Oppi-logo.png";
        string logoSrc = publicLogoUrl;

        var logoBytes = GetLogoBytes();
        if (logoBytes != null && logoBytes.Length > 0)
        {
            try
            {
                var logoResource = builder.LinkedResources.Add("Oppi-logo.png", logoBytes, new ContentType("image", "png"));
                logoResource.ContentId = "oppi_logo";
                logoResource.ContentDisposition = new ContentDisposition(ContentDisposition.Inline);
                logoSrc = "cid:oppi_logo";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to attach logo LinkedResource to email, falling back to public URL: {Url}", publicLogoUrl);
                logoSrc = publicLogoUrl;
            }
        }
        else
        {
            _logger.LogInformation("Using public URL for email logo: {Url}", publicLogoUrl);
            logoSrc = publicLogoUrl;
        }

        builder.HtmlBody = BuildEmailHtml(htmlContent, logoSrc);
        message.Body = builder.ToMessageBody();

        try
        {
            using var client = new MailKit.Net.Smtp.SmtpClient();
            client.CheckCertificateRevocation = false;
            client.Timeout = 20000;

            var secureOption = enableSsl 
                ? (port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls) 
                : SecureSocketOptions.None;

            _logger.LogInformation("Sending email ({Subject}) to {Email} via {Host}:{Port}...", subject, recipientEmail, host, port);
            await client.ConnectAsync(host, port, secureOption);

            if (!string.IsNullOrEmpty(username))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}.", recipientEmail);

            await LogEmailAuditAsync(
                userId, 
                actionSuccess ?? "EMAIL_SENT", 
                entityType ?? "Email", 
                entityId, 
                $"Sent email ({subject}) to {recipientEmail}");
        }
        catch (Exception ex)
        {
            var errorDetails = ex.Message;
            if (ex.InnerException != null && !string.IsNullOrWhiteSpace(ex.InnerException.Message))
            {
                errorDetails += $" | Inner: {ex.InnerException.Message}";
            }

            _logger.LogError(ex, "Failed to send email ({Subject}) to {Email}: {Error}", subject, recipientEmail, errorDetails);

            await LogEmailAuditAsync(
                userId, 
                actionFailure ?? "EMAIL_FAILED", 
                entityType ?? "Email", 
                entityId, 
                $"Failed sending email ({subject}) to {recipientEmail}. Error: {errorDetails}");

            throw;
        }
    }

    public async Task SendRegistrationEmailAsync(string recipientEmail, string recipientName, int? userId = null)
    {
        var frontendUrl = _config["FrontendUrl"] ?? "https://annualawards.indiaoppi.com";
        var loginLink = $"{frontendUrl}/login";

        string plainTextBody = $@"Dear {recipientName},

Thank you for registering for the OPPI Annual Awards for the year 2026.

To proceed with your application, please log in to the awards portal using your credentials:
{loginLink}

For any technical assistance or queries related to the application process, please write to the following:
OPPI Communications communications@indiaoppi.com
Ms. Clara Rodricks clara.rodricks@indiaoppi.com

We look forward to receiving your submission before the timelines.

Warm regards,
Team - OPPI Awards";

        string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Thank you for registering for the <strong>OPPI Annual Awards for the year 2026</strong>.</p>
<p style=""margin: 0 0 20px 0;"">To proceed with your application, please log in to the awards portal using your credentials:</p>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""{loginLink}"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Log in to Awards Portal</a>
</p>
<p style=""margin: 0 0 20px 0; font-size: 0.9em; word-break: break-all; color: #666666;"">
    If you cannot click the button above, copy and paste this URL into your browser:<br>
    <a href=""{loginLink}"" style=""color: #165baf; text-decoration: underline;"">{loginLink}</a>
</p>
<div style=""margin: 0 0 25px 0; font-size: 14px; color: #555555; border-left: 3px solid #2db4cc; padding-left: 12px; line-height: 1.5;"">
    For any technical assistance or queries related to the application process, please write to the following:<br>
    <strong>OPPI Communications</strong>: <a href=""mailto:communications@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">communications@indiaoppi.com</a><br>
    <strong>Ms. Clara Rodricks</strong>: <a href=""mailto:clara.rodricks@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">clara.rodricks@indiaoppi.com</a>
</div>
<p style=""margin: 0 0 20px 0;"">We look forward to receiving your submission before the timelines.</p>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

        await SendMailInternalAsync(
            recipientEmail, 
            recipientName, 
            "Registration Confirmation - OPPI Annual Awards 2026", 
            plainTextBody, 
            htmlContent,
            userId: userId,
            entityType: "User",
            entityId: userId,
            actionSuccess: "SEND_REGISTRATION_EMAIL",
            actionFailure: "SEND_REGISTRATION_EMAIL_FAILED");
    }

    public async Task SendResetPasswordEmailAsync(string recipientEmail, string recipientName, string resetToken, int? userId = null)
    {
        var frontendUrl = _config["FrontendUrl"] ?? "https://annualawards.indiaoppi.com";
        var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(recipientEmail)}&token={Uri.EscapeDataString(resetToken)}";

        string plainTextBody = $@"Dear {recipientName},

Your password reset request has been received successfully.

To reset your password, please click the link below:
{resetLink}

For any technical assistance or queries related to the application process, please write to the following:
OPPI Communications communications@indiaoppi.com
Ms. Clara Rodricks clara.rodricks@indiaoppi.com

Warm regards,
Team - OPPI Awards";

        string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Your password reset request has been received successfully.</p>
<p style=""margin: 0 0 20px 0;"">To reset your password, please click the button below:</p>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""{resetLink}"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Reset Password</a>
</p>
<p style=""margin: 0 0 20px 0; font-size: 0.9em; word-break: break-all; color: #666666;"">
    If you cannot click the button above, copy and paste this URL into your browser:<br>
    <a href=""{resetLink}"" style=""color: #165baf; text-decoration: underline;"">{resetLink}</a>
</p>
<div style=""margin: 0 0 25px 0; font-size: 14px; color: #555555; border-left: 3px solid #2db4cc; padding-left: 12px; line-height: 1.5;"">
    For any technical assistance or queries related to the application process, please write to the following:<br>
    <strong>OPPI Communications</strong>: <a href=""mailto:communications@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">communications@indiaoppi.com</a><br>
    <strong>Ms. Clara Rodricks</strong>: <a href=""mailto:clara.rodricks@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">clara.rodricks@indiaoppi.com</a>
</div>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

        await SendMailInternalAsync(
            recipientEmail, 
            recipientName, 
            "Reset Password", 
            plainTextBody, 
            htmlContent,
            userId: userId,
            entityType: "User",
            entityId: userId,
            actionSuccess: "SEND_RESET_PASSWORD",
            actionFailure: "SEND_RESET_PASSWORD_FAILED");
    }

    public async Task SendRegisteredReminderEmailAsync(string recipientEmail, string recipientName, int? userId = null)
    {
        await SendReminderEmailInternalAsync(
            recipientEmail, 
            recipientName, 
            "Reminder: Complete your OPPI Awards Registration",
            userId: userId,
            entityId: userId,
            entityType: "User",
            actionSuccess: "SEND_REGISTERED_REMINDER",
            actionFailure: "SEND_REGISTERED_REMINDER_FAILED");
    }

    public async Task SendDraftReminderEmailAsync(string recipientEmail, string recipientName, int? userId = null, int? applicationId = null)
    {
        await SendReminderEmailInternalAsync(
            recipientEmail, 
            recipientName, 
            "Reminder: Complete your OPPI Awards Draft Application",
            userId: userId,
            entityId: applicationId,
            entityType: "Application",
            actionSuccess: "SEND_DRAFT_REMINDER",
            actionFailure: "SEND_DRAFT_REMINDER_FAILED");
    }

    private async Task SendReminderEmailInternalAsync(
        string recipientEmail, 
        string recipientName, 
        string subject,
        int? userId = null,
        int? entityId = null,
        string? entityType = null,
        string? actionSuccess = null,
        string? actionFailure = null)
    {
        var frontendUrl = _config["FrontendUrl"] ?? "https://annualawards.indiaoppi.com";
        var loginLink = $"{frontendUrl}/login";

        string plainTextBody = $@"Dear {recipientName},

We have received your registration for the OPPI Annual Awards for the year 2026.

To proceed with your application, please login here: {loginLink}

For any technical assistance or queries related to the application process, please write to the following:
OPPI Communications communications@indiaoppi.com
Ms. Clara Rodricks clara.rodricks@indiaoppi.com

We look forward to receiving your submission before the timelines.

Warm regards,
Team - OPPI Awards";

        string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">We have received your registration for the <strong>OPPI Annual Awards for the year 2026</strong>.</p>
<p style=""margin: 0 0 20px 0;"">To proceed with your application, please login here:</p>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""{loginLink}"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Log in to Awards Portal</a>
</p>
<p style=""margin: 0 0 20px 0; font-size: 0.9em; word-break: break-all; color: #666666;"">
    If you cannot click the button above, copy and paste this URL into your browser:<br>
    <a href=""{loginLink}"" style=""color: #165baf; text-decoration: underline;"">{loginLink}</a>
</p>
<div style=""margin: 0 0 25px 0; font-size: 14px; color: #555555; border-left: 3px solid #2db4cc; padding-left: 12px; line-height: 1.5;"">
    For any technical assistance or queries related to the application process, please write to the following:<br>
    <strong>OPPI Communications</strong>: <a href=""mailto:communications@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">communications@indiaoppi.com</a><br>
    <strong>Ms. Clara Rodricks</strong>: <a href=""mailto:clara.rodricks@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">clara.rodricks@indiaoppi.com</a>
</div>
<p style=""margin: 0 0 20px 0;"">We look forward to receiving your submission before the timelines.</p>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

        await SendMailInternalAsync(
            recipientEmail, 
            recipientName, 
            subject, 
            plainTextBody, 
            htmlContent,
            userId: userId,
            entityId: entityId,
            entityType: entityType,
            actionSuccess: actionSuccess,
            actionFailure: actionFailure);
    }

    public async Task SendApplicationSubmissionEmailAsync(string recipientEmail, string recipientName, int applicationId, int? userId = null)
    {
        string plainTextBody = $@"Dear {recipientName},

Thank you for submitting your application for the OPPI Annual Awards for the year 2026.

Please note your application no. for future correspondence - {applicationId}

We appreciate your participation and wish you continued success.

Warm regards,
Team - OPPI Awards";

        string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Thank you for submitting your application for the <strong>OPPI Annual Awards for the year 2026</strong>.</p>
<div style=""margin: 0 0 25px 0; font-size: 16px; color: #165baf; background-color: #f0f7ff; padding: 12px 18px; border-radius: 6px; border: 1px solid #d0e4ff; display: inline-block; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
    <strong>Application No:</strong> {applicationId}
</div>
<p style=""margin: 0 0 30px 0;"">We appreciate your participation and wish you continued success.</p>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

        await SendMailInternalAsync(
            recipientEmail, 
            recipientName, 
            "Application Submission - OPPI Annual Awards 2026", 
            plainTextBody, 
            htmlContent,
            userId: userId,
            entityId: applicationId,
            entityType: "Application",
            actionSuccess: "SEND_SUBMISSION_EMAIL",
            actionFailure: "SEND_SUBMISSION_EMAIL_FAILED");
    }
}
