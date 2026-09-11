using System.IO;
using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace OppiInnovationApi.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, IWebHostEnvironment env, ILogger<EmailService> logger)
    {
        _config = config;
        _env = env;
        _logger = logger;
    }

    private void PopulateEmailHtmlBody(MailMessage mail, string bodyContent)
    {
        string plainText = mail.Body;

        mail.Body = null;
        mail.IsBodyHtml = false;
        mail.AlternateViews.Clear();

        if (!string.IsNullOrEmpty(plainText))
        {
            var plainView = AlternateView.CreateAlternateViewFromString(plainText, Encoding.UTF8, "text/plain");
            mail.AlternateViews.Add(plainView);
        }

        string htmlBody = $@"
<!DOCTYPE html>
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
                            <img src=""cid:oppi_logo"" height=""65"" alt=""OPPI Logo"" style=""display: block; border: 0; outline: none; text-decoration: none;"" />
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

        var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, "text/html");
        
        var logoPath = Path.Combine(_env.WebRootPath, "uploads", "Oppi-logo.png");
        if (File.Exists(logoPath))
        {
            var logoResource = new LinkedResource(logoPath, "image/png")
            {
                ContentId = "oppi_logo",
                TransferEncoding = System.Net.Mime.TransferEncoding.Base64
            };
            logoResource.ContentType.Name = Path.GetFileName(logoPath);
            htmlView.LinkedResources.Add(logoResource);
        }

        mail.AlternateViews.Add(htmlView);
    }

    private async Task SendMailInternalAsync(string recipientEmail, string recipientName, string subject, string plainTextBody, string htmlContent)
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

        using var mail = new MailMessage();
        mail.From = new MailAddress(senderEmail, senderName);
        mail.To.Add(new MailAddress(recipientEmail, recipientName));
        mail.Subject = subject;
        mail.Body = plainTextBody;
        mail.IsBodyHtml = false;

        PopulateEmailHtmlBody(mail, htmlContent);

        using var smtp = new SmtpClient(host, port)
        {
            Credentials = !string.IsNullOrEmpty(username) ? new NetworkCredential(username, password) : null,
            EnableSsl = enableSsl
        };

        _logger.LogInformation("Sending email ({Subject}) to {Email}...", subject, recipientEmail);
        await smtp.SendMailAsync(mail);
        _logger.LogInformation("Email sent successfully to {Email}.", recipientEmail);
    }

    public async Task SendRegistrationEmailAsync(string recipientEmail, string recipientName)
    {
        try
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

            await SendMailInternalAsync(recipientEmail, recipientName, "Registration Confirmation - OPPI Annual Awards 2026", plainTextBody, htmlContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send registration email to {Email}.", recipientEmail);
        }
    }

    public async Task SendResetPasswordEmailAsync(string recipientEmail, string recipientName, string resetToken)
    {
        try
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

            await SendMailInternalAsync(recipientEmail, recipientName, "Reset Password", plainTextBody, htmlContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send reset password email to {Email}.", recipientEmail);
        }
    }

    public async Task SendRegisteredReminderEmailAsync(string recipientEmail, string recipientName)
    {
        await SendReminderEmailInternalAsync(recipientEmail, recipientName, "Reminder: Complete your OPPI Awards Registration");
    }

    public async Task SendDraftReminderEmailAsync(string recipientEmail, string recipientName)
    {
        await SendReminderEmailInternalAsync(recipientEmail, recipientName, "Reminder: Complete your OPPI Awards Draft Application");
    }

    private async Task SendReminderEmailInternalAsync(string recipientEmail, string recipientName, string subject)
    {
        try
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

            await SendMailInternalAsync(recipientEmail, recipientName, subject, plainTextBody, htmlContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send reminder email to {Email}.", recipientEmail);
        }
    }

    public async Task SendApplicationSubmissionEmailAsync(string recipientEmail, string recipientName, int applicationId)
    {
        try
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

            await SendMailInternalAsync(recipientEmail, recipientName, "Application Submission - OPPI Annual Awards 2026", plainTextBody, htmlContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send application submission email to {Email}.", recipientEmail);
        }
    }
}
