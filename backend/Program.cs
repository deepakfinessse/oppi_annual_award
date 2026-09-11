using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Text;
using System.Security.Claims;
using FluentValidation;
using Serilog;
using OppiInnovationApi.Models;
using OppiInnovationApi.DTOs;
using OppiInnovationApi.Services;
using OppiInnovationApi.Middleware;
using OppiInnovationApi.Validators;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console().WriteTo.File("logs/innovation-.log", rollingInterval: RollingInterval.Day)
    .Enrich.FromLogContext().MinimumLevel.Information().CreateLogger();

try {
var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

var connStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? Environment.GetEnvironmentVariable("DB_CONNECTION") ?? throw new Exception("DB_CONNECTION missing");
var jwtKey = builder.Configuration["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY missing");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers";
var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:5174";

builder.Services.AddDbContext<InnovationDbContext>(o => o.UseMySql(connStr, ServerVersion.AutoDetect(connStr)));
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<DomainService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddSingleton<ReminderEmailBackgroundService>();
builder.Services.AddHostedService<ReminderEmailBackgroundService>(p => p.GetRequiredService<ReminderEmailBackgroundService>());
builder.Services.AddScoped<IValidator<RegisterDto>, RegisterValidator>();
builder.Services.AddScoped<IValidator<LoginDto>, LoginValidator>();
builder.Services.AddScoped<IValidator<ChangePasswordDto>, ChangePasswordValidator>();
builder.Services.AddScoped<IValidator<ResetPasswordDto>, ResetPasswordValidator>();
builder.Services.AddScoped<IValidator<ForgotPasswordDto>, ForgotPasswordValidator>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ICaptchaService, CaptchaService>();

var azureStorageConn = builder.Configuration["AzureStorage:ConnectionString"] ?? Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING");
if (!string.IsNullOrEmpty(azureStorageConn))
{
    builder.Services.AddScoped<IStorageService, AzureBlobStorageService>();
}
else
{
    builder.Services.AddScoped<IStorageService, LocalFileStorageService>();
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => {
    o.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
        ValidateIssuerSigningKey = true, ValidIssuer = jwtIssuer, ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role, NameClaimType = ClaimTypes.NameIdentifier
    };
});

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanReview", p => p.RequireRole("VALIDATOR", "JURY", "ADMIN"));

builder.Services.AddRateLimiter(o => {
    o.AddFixedWindowLimiter("auth", x => { x.PermitLimit = 10; x.Window = TimeSpan.FromMinutes(1); });
    o.AddFixedWindowLimiter("api", x => { x.PermitLimit = 60; x.Window = TimeSpan.FromMinutes(1); });
    o.RejectionStatusCode = 429;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => {
    o.AddPolicy("Dev", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    o.AddPolicy("Prod", p => p.WithOrigins(allowedOrigins.Split(',')).AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

var app = builder.Build();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

// Auto-create tables and migrate missing columns
using (var scope = app.Services.CreateScope())
{
    var db2 = scope.ServiceProvider.GetRequiredService<InnovationDbContext>();
    try { db2.Database.EnsureCreated(); } catch (Exception ex) { Log.Warning(ex, "EnsureCreated failed – DB may already be up to date"); }

    // 1. Fetch existing columns to prevent duplicate column addition errors in EF Core / MySQL
    var existingColumns = new HashSet<string>();
    try
    {
        var conn = db2.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT CONCAT(TABLE_NAME, '.', COLUMN_NAME) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('applications', 'users', 'jury_reviews')";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            existingColumns.Add(reader.GetString(0).ToLower());
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Failed to pre-check existing database columns for migration check");
    }

    // 2. Safely add missing columns (only if they do not exist)
    var columnMigrations = new (string Table, string Column, string Sql)[]
    {
        ("applications", "validator_id", "ALTER TABLE `applications` ADD COLUMN `validator_id` INT NULL"),
        ("applications", "jury_id", "ALTER TABLE `applications` ADD COLUMN `jury_id` INT NULL"),
        ("applications", "panel_chair_id", "ALTER TABLE `applications` ADD COLUMN `panel_chair_id` INT NULL"),
        ("applications", "submitted_at", "ALTER TABLE `applications` ADD COLUMN `submitted_at` DATETIME(6) NULL"),
        ("applications", "validator_action_at", "ALTER TABLE `applications` ADD COLUMN `validator_action_at` DATETIME(6) NULL"),
        ("applications", "jury_action_at", "ALTER TABLE `applications` ADD COLUMN `jury_action_at` DATETIME(6) NULL"),
        ("applications", "panel_chair_action_at", "ALTER TABLE `applications` ADD COLUMN `panel_chair_action_at` DATETIME(6) NULL"),
        ("applications", "rejection_reason", "ALTER TABLE `applications` ADD COLUMN `rejection_reason` TEXT NULL"),
        ("users", "reset_password_token", "ALTER TABLE `users` ADD COLUMN `reset_password_token` VARCHAR(255) NULL"),
        ("users", "reset_password_expiry", "ALTER TABLE `users` ADD COLUMN `reset_password_expiry` DATETIME(6) NULL"),
        ("users", "title", "ALTER TABLE `users` ADD COLUMN `title` VARCHAR(50) NULL"),
        ("users", "middle_name", "ALTER TABLE `users` ADD COLUMN `middle_name` VARCHAR(100) NULL"),
        ("users", "dob", "ALTER TABLE `users` ADD COLUMN `dob` VARCHAR(50) NULL"),
        ("users", "gender", "ALTER TABLE `users` ADD COLUMN `gender` VARCHAR(50) NULL"),
        ("users", "organisation", "ALTER TABLE `users` ADD COLUMN `organisation` VARCHAR(255) NULL"),
        ("jury_reviews", "comments", "ALTER TABLE `jury_reviews` ADD COLUMN `comments` TEXT NULL"),
        ("panel_members", "sort_order", "ALTER TABLE `panel_members` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0"),
        ("panel_members", "category", "ALTER TABLE `panel_members` ADD COLUMN `category` VARCHAR(100) NULL"),
        ("jury_reviews", "is_draft", "ALTER TABLE `jury_reviews` ADD COLUMN `is_draft` TINYINT(1) NOT NULL DEFAULT 0"),
        ("past_winners", "color", "ALTER TABLE `past_winners` ADD COLUMN `color` VARCHAR(50) NULL")
    };

    foreach (var migration in columnMigrations)
    {
        var key = $"{migration.Table}.{migration.Column}".ToLower();
        if (!existingColumns.Contains(key))
        {
            try
            {
                db2.Database.ExecuteSqlRaw(migration.Sql);
                Log.Information("Migration: Added column {Column} to table {Table}", migration.Column, migration.Table);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Failed to execute migration: {Sql}", migration.Sql);
            }
        }
    }

    // 3. Create tables or modify columns that can be run repeatedly without duplicate errors
    var migrationSql = new[]
    {
        // applicant_details table
        @"CREATE TABLE IF NOT EXISTS `applicant_details` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `application_id` INT NOT NULL,
            `photo_path` VARCHAR(255) NULL,
            `title` VARCHAR(10) NULL,
            `first_name` VARCHAR(100) NULL,
            `middle_name` VARCHAR(100) NULL,
            `last_name` VARCHAR(100) NULL,
            `dob` VARCHAR(20) NULL,
            `gender` VARCHAR(20) NULL,
            `email` VARCHAR(255) NULL,
            `telephone` VARCHAR(20) NULL,
            `mobile` VARCHAR(20) NULL,
            `discipline` VARCHAR(255) NULL,
            `institute_category` VARCHAR(100) NULL,
            `institute_name` VARCHAR(255) NULL,
            `updated_at` DATETIME(6) NULL,
            PRIMARY KEY (`id`),
            KEY `ix_applicant_details_application_id` (`application_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // application_details table
        @"CREATE TABLE IF NOT EXISTS `application_details` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `application_id` INT NOT NULL,
            `category` VARCHAR(50) NULL,
            `brief_statement` TEXT NULL,
            `significant_contribution` TEXT NULL,
            `impact_contribution` TEXT NULL,
            `has_patent` TINYINT(1) NULL,
            `cv_file_path` VARCHAR(255) NULL,
            `cv_file_name` VARCHAR(255) NULL,
            `auth_cert_file_path` VARCHAR(255) NULL,
            `auth_cert_file_name` VARCHAR(255) NULL,
            `updated_at` DATETIME(6) NULL,
            PRIMARY KEY (`id`),
            KEY `ix_application_details_application_id` (`application_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // patents table
        @"CREATE TABLE IF NOT EXISTS `patents` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `application_detail_id` INT NOT NULL,
            `title` TEXT NULL,
            `type` VARCHAR(50) NULL,
            `has_attachment` TINYINT(1) NULL,
            `attachment_path` VARCHAR(255) NULL,
            `attachment_file_name` VARCHAR(255) NULL,
            `is_primary_writer` TINYINT(1) NULL,
            `sort_order` INT NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `ix_patents_application_detail_id` (`application_detail_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // jury_reviews table
        @"CREATE TABLE IF NOT EXISTS `jury_reviews` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `application_id` INT NOT NULL,
            `jury_id` INT NOT NULL,
            `innovation_ip_score` INT NOT NULL DEFAULT 0,
            `team_strength_score` INT NOT NULL DEFAULT 0,
            `business_plan_score` INT NOT NULL DEFAULT 0,
            `impact_score` INT NOT NULL DEFAULT 0,
            `weighted_score` DOUBLE NOT NULL DEFAULT 0,
            `created_at` DATETIME(6) NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `ix_jury_reviews_application_id_jury_id` (`application_id`, `jury_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // audit_logs table
        @"CREATE TABLE IF NOT EXISTS `audit_logs` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `user_id` INT NULL,
            `action` VARCHAR(100) NOT NULL,
            `entity_type` VARCHAR(100) NULL,
            `entity_id` INT NULL,
            `details` TEXT NULL,
            `ip_address` VARCHAR(50) NULL,
            `created_at` DATETIME(6) NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Update status enum to include all required values
        @"ALTER TABLE `applications` MODIFY COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT'",

        // Ensure newly added fields are in the database columns list
        @"ALTER TABLE `applicant_details` ADD COLUMN `institute_name` VARCHAR(255) NULL",
        @"ALTER TABLE `applicant_details` ADD COLUMN `institute_category` VARCHAR(100) NULL",

        // panel_members table
        @"CREATE TABLE IF NOT EXISTS `panel_members` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(150) NOT NULL,
            `role` TEXT NOT NULL,
            `type` VARCHAR(30) NOT NULL,
            `image_path` VARCHAR(255) NULL,
            `sort_order` INT NOT NULL DEFAULT 0,
            `email` VARCHAR(150) NULL,
            `password` VARCHAR(150) NULL,
            `created_at` DATETIME(6) NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // past_winners table
        @"CREATE TABLE IF NOT EXISTS `past_winners` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `year` INT NOT NULL,
            `category` VARCHAR(100) NOT NULL,
            `name` VARCHAR(150) NOT NULL,
            `description` TEXT NOT NULL,
            `image_path` VARCHAR(255) NULL,
            `created_at` DATETIME(6) NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        // validator_reviews table
        @"CREATE TABLE IF NOT EXISTS `validator_reviews` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `application_id` INT NOT NULL,
            `validator_id` INT NOT NULL,
            `innovation_ip_score` INT NOT NULL DEFAULT 0,
            `team_strength_score` INT NOT NULL DEFAULT 0,
            `business_plan_score` INT NOT NULL DEFAULT 0,
            `impact_score` INT NOT NULL DEFAULT 0,
            `weighted_score` DOUBLE NOT NULL DEFAULT 0,
            `comments` TEXT NULL,
            `is_draft` TINYINT(1) NOT NULL DEFAULT 0,
            `created_at` DATETIME(6) NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `ix_validator_reviews_application_id_validator_id` (`application_id`, `validator_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        @"ALTER TABLE `panel_members` ADD COLUMN `email` VARCHAR(150) NULL",
        @"ALTER TABLE `panel_members` ADD COLUMN `password` VARCHAR(150) NULL",
        @"ALTER TABLE `patents` ADD COLUMN `type` VARCHAR(50) NULL",
        @"ALTER TABLE `application_details` ADD COLUMN `has_publication` TINYINT(1) NULL"
    };

    foreach (var sql in migrationSql)
    {
        try { db2.Database.ExecuteSqlRaw(sql); }
        catch (Exception ex) { Log.Warning("Migration SQL skipped (may already exist): {Message} | Sql: {Sql}", ex.Message, sql[..Math.Min(sql.Length, 80)]); }
    }
    Log.Information("Database migration check completed");

    // 4. Seed and synchronize default panel members and user accounts
    var fullSeedPanel = new (string Name, string Role, string Type, string Category, string Email, string Password, int SortOrder, string? ImagePath)[]
    {
        ("Dr. Prabhat Ranjan Mishra", "Chief Scientist & Head, Pharmaceutics & Pharmacokinetics Division, CSIR-Central Drug Research Institute, Lucknow", "VALIDATOR", "General", "validator@nivyam.com", "Password123!", 1, "/validator.png"),
        ("Dr. M. N. Welling", "Advisor to President - Shri Vile Parle Kelavani Mandal (SVKM) & to Chancellor - Narsee Monjee Institute of Management Studies (NMIMS), Mumbai", "PANEL_CHAIR", "General", "panelchair@nivyam.com", "Password123!", 2, "/jury1.png"),
        ("Shekhar C. Mande", "FNA, FASc, FNASc, Distinguished Professor, Bioinformatics Centre Savitribai Phule Pune University, Pune & Honorary Distinguished Scientist National Centre for Cell Science, Pune", "JURY", "General", "jury@nivyam.com", "Password123!", 3, "/jury2.png"),
        ("Prof. P. Balaram", "(Former Director, IISc), DST-Yos Chair Professor National Center for Biological Sciences (NCBS), Bangalore", "JURY", "General", "balaram@nivyam.com", "Password123!", 4, "/jury1.png"),
        ("Prof. K. G. Akamanchi", "Professor of Pharmaceutical Technology at the Institute of Chemical Technology (Retired), Former Head of Department of Pharmaceutical Sciences and Technology, and Chairperson Research, Consultancy & Resource Mobilisation", "JURY", "General", "akamanchi@nivyam.com", "Password123!", 5, "/jury1.png"),
        ("Prof. Y K Gupta", "President, AIIMS Jammu, Principal Advisor India, GARGIP Geneva, Former Dean and Head of Pharmacology, AIIMS, New Delhi", "JURY", "General", "gupta@nivyam.com", "Password123!", 6, "/jury2.png"),

        // OPPI Healthcare Communications Award
        ("Aman Gupta", "Managing Partner - Health Practice Asia Lead, FINN Partners", "JURY", "OPPI Healthcare Communications Award", "aman.gupta@finnpartners.com", "awards25", 7, null),
        ("Dilip Yadav", "Founding Partner, First Partners", "JURY", "OPPI Healthcare Communications Award", "dilip@firstpartners.in", "awards25", 8, null),
        ("Srikanth Srinivas", "Strategic Communications Consultant", "JURY", "OPPI Healthcare Communications Award", "srikanthsrinivas66@gmail.com", "awards25", 9, null),
        ("Viveka Roychowdhury", "Editor, Express Pharma & Express Healthcare, Indian Express", "JURY", "OPPI Healthcare Communications Award", "viveka.r@expressindia.com", "awards25", 10, null),

        // OPPI HR Award for Diversity & Inclusion
        ("Deepa Shankar", "Founder - Authempic Consulting / Diversity & Inclusion Consultant", "JURY", "OPPI HR Award for Diversity & Inclusion", "deepa@authempic.com", "awards25", 11, null),
        ("Dr Niru Kumar", "Founder & CEO, Ask Insight", "JURY", "OPPI HR Award for Diversity & Inclusion", "drniru@askinsights.com", "awards25", 12, null),
        ("Karthik Ekambaram", "Co-founder and Head of Solutions, Avtar Group", "JURY", "OPPI HR Award for Diversity & Inclusion", "ek@avtarcc.com", "awards25", 13, null),
        ("Roma Balwani", "Co-Founder, RB Foundation, Mentor| Independent Director | CEO & Brand Custodian, Indian Deaf Cricket Association, | Advisory Committee Member", "JURY", "OPPI HR Award for Diversity & Inclusion", "roma.balwani@outlook.com", "awards25", 14, null),
        ("Sonica Aron", "CEO, Marching Sheep, Board Member, Gender@Work India Trust", "JURY", "OPPI HR Award for Diversity & Inclusion", "sonica@marchingsheep.com", "awards25", 15, null),

        // OPPI HR Excellence Award
        ("Ashwini D Prakash", "Managing Partner and Board Director, Singapore and India at Stanton Chase", "JURY", "OPPI HR Excellence Award", "ashwini.d@stantonchase.com", "awards25", 16, null),
        ("Kavi Arasu", "Principal, Flyntrok Consulting", "JURY", "OPPI HR Excellence Award", "kavi@flyntrok.com", "awards25", 17, null),
        ("Sanjay Banerjee", "Proprietor, Banerjee Consulting", "JURY", "OPPI HR Excellence Award", "banerjs.2000@gmail.com", "awards25", 18, null),
        ("Shilpa Gentela", "Senior Client Partner, Korn Ferry", "JURY", "OPPI HR Excellence Award", "Shilpa.Gentela@KornFerry.com", "awards25", 19, null),

        // Dr H R Nanji Memorial, OPPI Marketing Excellence Award: Existing Pharma Product & New Pharma Product
        ("Archana Jain", "CEO, PR Pundit Havas Red", "JURY", "Dr H R Nanji Memorial, OPPI Marketing Excellence Award: Existing Pharma Product & New Pharma Product", "archana.j@prpundit.com", "awards25", 20, null),
        ("Jitendra Tyagi", "Senior Advisor and independent consultant", "JURY", "Dr H R Nanji Memorial, OPPI Marketing Excellence Award: Existing Pharma Product & New Pharma Product", "Tyagi.jitendra2@gmail.com", "awards25", 21, null),
        ("Praful Akali", "Founder & MD, Medulla Communications Pvt. Ltd.", "JURY", "Dr H R Nanji Memorial, OPPI Marketing Excellence Award: Existing Pharma Product & New Pharma Product", "praful@medulla.in", "awards25", 22, null),
        ("Salil S. Kallianpur", "Founder & MD, ARKS Knowledge Consulting Pvt. Ltd.", "JURY", "Dr H R Nanji Memorial, OPPI Marketing Excellence Award: Existing Pharma Product & New Pharma Product", "skallianpur@gmail.com", "awards25", 23, null),
        ("Susan Josi", "Former MD, Havas Health & You , South East Asia & Middle East", "JURY", "Dr H R Nanji Memorial, OPPI Marketing Excellence Award: Existing Pharma Product & New Pharma Product", "sjosi0607@gmail.com", "awards25", 24, null),

        // OPPI Medical Excellence Award
        ("Dr Arun Bhatt", "Consultant – Clinical Research & Drug Development", "JURY", "OPPI Medical Excellence Award", "arun_dbhatt@hotmail.com", "awards25", 25, null),
        ("Dr Milind Antani", "Nishith Desai Associates, Legal & Tax Counseling Worldwide", "JURY", "OPPI Medical Excellence Award", "milind.antani@nishithdesai.com", "awards25", 26, null),
        ("Dr Rashmi Kulshrestha", "Founder and CEO, Regulatory Wisdom", "JURY", "OPPI Medical Excellence Award", "dr_rashmi@regulatorywisdom.com", "awards25", 27, null),
        ("Dr Suresh Menon", "Director - Medical, Themis Medicare", "JURY", "OPPI Medical Excellence Award", "suresh.menon@themismedicare.com", "awards25", 28, null),
        ("Dr. Purvish M. Parikh", "MD, DNB, FICP, PhD, ECMO, CPI, Medical Oncology & Hematology, Prof & Head of Clinical Hematology, MGMC&H, Jaipur", "JURY", "OPPI Medical Excellence Award", "purvish1@gmail.com", "awards25", 29, null),

        // OPPI Sales Force Excellence Award
        ("Ariz Rizvi", "Head – Health Risk Management, Aon", "JURY", "OPPI Sales Force Excellence Award", "ariz.rizvi@aon.com", "awards25", 30, null),
        ("Gauri Pathak", "Country Service Line Leader, Healthcare, Ipsos", "JURY", "OPPI Sales Force Excellence Award", "Gauri.Pathak@ipsos.com", "awards25", 31, null),
        ("Pawan Garg", "CEO-Volo Health", "JURY", "OPPI Sales Force Excellence Award", "pawangarg9@gmail.com", "awards25", 32, null),

        // OPPI Sustainability Excellence Award
        ("Dr. Pragnya Ram", "Group Executive President - CSR, Legacy Documentation & Archives, Aditya Birla Management Corporation Pvt. Ltd.", "JURY", "OPPI Sustainability Excellence Award", "pragnya.ram@adityabirla.com", "awards25", 33, null),
        ("Ravi Menon", "Senior Business Leader and Professional - Pharmaceuticals/Healthcare", "JURY", "OPPI Sustainability Excellence Award", "menon.ravindranath@gmail.com", "awards25", 34, null),
        ("Sanjiv Navangul", "Managing Director and CEO, Bharat Serums and Vaccines Limited", "JURY", "OPPI Sustainability Excellence Award", "sanjiv.navangul@bsvgroup.com", "awards25", 35, null),
        ("Yugal Sikri", "Operating Advisor, TA Associates and Abu Dhabi Investment Authority (ADIA); Board Director and Former MD, RPG Life Sciences; Former India Region CEO, Ranbaxy", "JURY", "OPPI Sustainability Excellence Award", "yug.sikri@gmail.com", "awards25", 36, null),

        // Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity
        ("Dr Indu Bhushan", "President - iLEP, Former CEO Ayushman Bharat/National Health Authority", "JURY", "Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity", "ibhushan6161@gmail.com", "awards25", 37, null),
        ("Dr Ratna Devi", "CEO, DakshamA Health, Director, PAIR (Patient Academy for Innovation and Research), Steering Committee Member NCD Labs, WHO Geneva", "JURY", "Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity", "ratna.devi@dakshamahealth.org", "awards25", 38, null),
        ("Prasanna Shirol", "Co founder and Executive Director, Organization for Rare Diseases India (ORDI)", "JURY", "Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity", "prasanna@ordindia.in", "awards25", 39, null),
        ("Raj Shankar Ghosh", "Lead, Health Consultancy, Nangia & Co. LLP", "JURY", "Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity", "raj.shankar.ghosh@outlook.com", "awards25", 40, null),
        ("Ranjeeta Vinil", "Founder Director of Saarathi and Co Prometheus Healthcare Pvt. Ltd", "JURY", "Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity", "Ranjeetavvinil@gmail.com", "awards25", 41, null),
        ("Viji Venkatesh", "Member of the Board of Directors, The Max Foundation and Founder, Managing Trustee, Friends of Max", "JURY", "Ranjit Shahani Memorial, OPPI Award for Excellence in Patient Centricity", "venkatesh.viji@gmail.com", "awards25", 42, null)
    };

    // Ensure Admin account exists
    if (!db2.Users.Any(u => u.Email == "admin@nivyam.com"))
    {
        db2.Users.Add(new User { FirstName = "Admin", LastName = "User", Email = "admin@nivyam.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"), Role = "ADMIN", CreatedAt = DateTime.UtcNow });
    }

    // Sync Users table and PanelMembers table
    var existingUsers = await db2.Users.ToListAsync();
    var existingPanelMembers = await db2.PanelMembers.ToListAsync();

    foreach (var item in fullSeedPanel)
    {
        var cleanEmail = item.Email.Trim();
        // 1. Sync User table
        var u = existingUsers.FirstOrDefault(x => x.Email.Equals(cleanEmail, StringComparison.OrdinalIgnoreCase));
        if (u == null)
        {
            var nameParts = item.Name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = nameParts.Length > 0 ? nameParts[0] : item.Name;
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";
            db2.Users.Add(new User
            {
                FirstName = firstName,
                LastName = lastName,
                Email = cleanEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(item.Password),
                Role = item.Type,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            });
            Log.Information("Created user account for jury: {Email} ({Role})", cleanEmail, item.Type);
        }

        // 2. Sync PanelMember table
        var pm = existingPanelMembers.FirstOrDefault(x =>
            (!string.IsNullOrEmpty(x.Email) && x.Email.Equals(cleanEmail, StringComparison.OrdinalIgnoreCase)) ||
            x.Name.Equals(item.Name, StringComparison.OrdinalIgnoreCase));

        if (pm == null)
        {
            db2.PanelMembers.Add(new PanelMember
            {
                Name = item.Name,
                Role = item.Role,
                Type = item.Type,
                Category = item.Category,
                Email = cleanEmail,
                Password = null,
                SortOrder = item.SortOrder,
                ImagePath = item.ImagePath,
                CreatedAt = DateTime.UtcNow
            });
            Log.Information("Added panel member: {Name} [{Category}]", item.Name, item.Category);
        }
        else
        {
            pm.Name = item.Name;
            pm.Role = item.Role;
            pm.Type = item.Type;
            pm.Category = item.Category;
            pm.Email = cleanEmail;
            pm.Password = null;
            pm.SortOrder = item.SortOrder;
            if (!string.IsNullOrEmpty(item.ImagePath)) pm.ImagePath = item.ImagePath;
        }
    }

    await db2.SaveChangesAsync();
    Log.Information("Panel members & User accounts synchronization complete");

    // 6. Seed default past winners if table is empty
    if (!db2.PastWinners.Any())
    {
        var seedWinners = new[]
        {
            new PastWinner { Year = 2025, Category = "SCIENTIST OF THE YEAR", Name = "Dr. Jyotirmayee Dash", Description = "Professor, Indian Association for The Cultivation of Sciences", ImagePath = "/winner1.png", Color = "#00468E" },
            new PastWinner { Year = 2025, Category = "WOMAN SCIENTIST OF THE YEAR", Name = "Dr. Ellora Sen", Description = "PhD, Scientist VII, National Brain Research Centre, Haryana", ImagePath = "/winner2.png", Color = "#015FC3" },
            new PastWinner { Year = 2025, Category = "YOUNG SCIENTIST OF THE YEAR", Name = "Dr. Vinaykumar Kanchupalli", Description = "DST Inspire Faculty, NIPER, Hyderabad", ImagePath = "/winner3.png", Color = "#0075EF" }
        };
        db2.PastWinners.AddRange(seedWinners);
        await db2.SaveChangesAsync();
        Log.Information("Seeded default past winners");
    }
}

var rawUploadsDir = builder.Configuration["UploadsFolder"] ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
var uploadsDir = Path.IsPathRooted(rawUploadsDir) ? rawUploadsDir : Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, rawUploadsDir));
if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx => {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    }
});

app.UseSerilogRequestLogging();
app.UseSwagger(); 
app.UseSwaggerUI();
if (app.Environment.IsDevelopment()) {
    // app.UseSwagger(); 
    // app.UseSwaggerUI(); 
    app.UseCors("Dev"); 
}
else {
    app.UseCors("Prod"); 
}
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

static int? GetUid(HttpContext c) { var s = c.User.FindFirst(ClaimTypes.NameIdentifier)?.Value; return int.TryParse(s, out var id) ? id : null; }
static string GetIp(HttpContext c) => c.Connection.RemoteIpAddress?.ToString() ?? "?";

// ========== AUTH ==========
var auth = app.MapGroup("/auth").RequireRateLimiting("auth");

auth.MapGet("/captcha", (ICaptchaService captchaService) =>
{
    var (id, image) = captchaService.GenerateCaptcha();
    return Results.Ok(new { captchaId = id, captchaImage = image });
});

auth.MapPost("/register", async (RegisterDto dto, InnovationDbContext db,
    JwtService jwt, AuditService audit, IValidator<RegisterDto> v, HttpContext ctx, ICaptchaService captchaService, EmailService emailService) =>
{
    if (!await captchaService.ValidateCaptchaAsync(dto.CaptchaId, dto.CaptchaAnswer))
        return Results.BadRequest(new { message = "Invalid or expired captcha" });

    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });
    if (db.Users.Any(x => x.Email == dto.Email)) return Results.BadRequest(new { message = "Email already registered" });

    var user = new User { 
        Title = dto.Title,
        FirstName = dto.First_Name, 
        MiddleName = dto.Middle_Name,
        LastName = dto.Last_Name, 
        Dob = dto.Dob,
        Gender = dto.Gender,
        Organisation = dto.Organisation,
        Email = dto.Email,
        Mobile = dto.Mobile, 
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
        Role = "USER", 
        CreatedAt = DateTime.UtcNow 
    };
    db.Users.Add(user); await db.SaveChangesAsync();

    var at = jwt.GenerateAccessToken(user);
    var rt = await jwt.GenerateRefreshTokenAsync(user, ctx.Request.Headers.UserAgent);
    await audit.LogAsync(user.Id, "REGISTER", "User", user.Id, null, GetIp(ctx));

    try
    {
        var displayName = $"{user.FirstName} {user.LastName}".Trim();
        await emailService.SendRegistrationEmailAsync(user.Email, displayName);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to send registration confirmation email to {Email}", user.Email);
    }

    return Results.Ok(new { access_token = at, refresh_token = rt,
        user = new { id = user.Id, title = user.Title, first_name = user.FirstName, middle_name = user.MiddleName, last_name = user.LastName,
            dob = user.Dob, gender = user.Gender, organisation = user.Organisation, email = user.Email, mobile = user.Mobile, role = user.Role } });
});

auth.MapPost("/login", async (LoginDto dto, InnovationDbContext db, JwtService jwt,
    AuditService audit, IValidator<LoginDto> v, HttpContext ctx, ICaptchaService captchaService) =>
{
    if (!await captchaService.ValidateCaptchaAsync(dto.CaptchaId, dto.CaptchaAnswer))
        return Results.BadRequest(new { message = "Invalid or expired captcha" });

    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });
    var user = db.Users.FirstOrDefault(x => x.Email == dto.Email);
    if (user == null)
    { await audit.LogAsync(null, "LOGIN_FAILED", null, null, $"Email: {dto.Email} - User not found", GetIp(ctx));
      return Results.BadRequest(new { message = "No account found with this email. Please register first." }); }
    if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
    { await audit.LogAsync(null, "LOGIN_FAILED", null, null, $"Email: {dto.Email} - Wrong password", GetIp(ctx));
      return Results.BadRequest(new { message = "Invalid credentials" }); }

    var at = jwt.GenerateAccessToken(user);
    var rt = await jwt.GenerateRefreshTokenAsync(user, ctx.Request.Headers.UserAgent);
    await audit.LogAsync(user.Id, "LOGIN", "User", user.Id, null, GetIp(ctx));

    return Results.Ok(new { access_token = at, refresh_token = rt,
        user = new { id = user.Id, title = user.Title, first_name = user.FirstName, middle_name = user.MiddleName, last_name = user.LastName,
            dob = user.Dob, gender = user.Gender, organisation = user.Organisation, email = user.Email, mobile = user.Mobile, role = user.Role } });
});

auth.MapPost("/forgot-password", async (ForgotPasswordDto dto, InnovationDbContext db, EmailService emailService, ICaptchaService captchaService, IValidator<ForgotPasswordDto> v) =>
{
    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });

    if (!await captchaService.ValidateCaptchaAsync(dto.CaptchaId, dto.CaptchaAnswer))
        return Results.BadRequest(new { message = "Invalid or expired captcha" });

    var user = db.Users.FirstOrDefault(x => x.Email == dto.Email);
    if (user == null) return Results.BadRequest(new { message = "Email not found" });

    // Generate a secure 6-digit numeric OTP token
    var otp = new Random().Next(100000, 999999).ToString();
    user.ResetPasswordToken = otp;
    user.ResetPasswordExpiry = DateTime.UtcNow.AddMinutes(15);
    await db.SaveChangesAsync();

    // Log request to server logs
    Log.Information("Password reset requested for {Email}", dto.Email);

    try
    {
        var displayName = $"{user.FirstName} {user.LastName}".Trim();
        await emailService.SendResetPasswordEmailAsync(dto.Email, displayName, otp);
        Log.Information("Password reset email sent successfully to {Email}", dto.Email);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to send password reset email to {Email}", dto.Email);
    }

    return Results.Ok(new { message = "Reset link sent to your email successfully" });
});

auth.MapPost("/reset-password", async (ResetPasswordDto dto, InnovationDbContext db, ICaptchaService captchaService, IValidator<ResetPasswordDto> v) =>
{
    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });

    if (!await captchaService.ValidateCaptchaAsync(dto.CaptchaId, dto.CaptchaAnswer))
        return Results.BadRequest(new { message = "Invalid or expired captcha" });

    var user = db.Users.FirstOrDefault(x => x.Email == dto.Email);
    if (user == null) return Results.BadRequest(new { message = "Email not found" });

    if (string.IsNullOrEmpty(user.ResetPasswordToken) || user.ResetPasswordToken != dto.Token)
        return Results.BadRequest(new { message = "Invalid reset token" });

    if (user.ResetPasswordExpiry == null || user.ResetPasswordExpiry < DateTime.UtcNow)
        return Results.BadRequest(new { message = "Reset token has expired" });

    // Hash and save the new password
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
    user.ResetPasswordToken = null;
    user.ResetPasswordExpiry = null;
    await db.SaveChangesAsync();

    Log.Information("Password reset successfully for {Email}", dto.Email);

    return Results.Ok(new { message = "Password has been reset successfully" });
});

auth.MapPost("/change-password", async (ChangePasswordDto dto, HttpContext ctx, InnovationDbContext db, ICaptchaService captchaService, IValidator<ChangePasswordDto> v) =>
{
    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });

    if (!await captchaService.ValidateCaptchaAsync(dto.CaptchaId, dto.CaptchaAnswer))
        return Results.BadRequest(new { message = "Invalid or expired captcha" });

    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value); if (user == null) return Results.NotFound();
    if (!BCrypt.Net.BCrypt.Verify(dto.Old_Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Current password is incorrect" });
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.New_Password);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Password changed" });
}).RequireAuthorization();

app.MapGet("/public/panel-members", async (InnovationDbContext db) =>
{
    var members = await db.PanelMembers
        .OrderBy(m => m.SortOrder)
        .Select(m => new {
            m.Id,
            m.Name,
            m.Role,
            m.Type,
            m.ImagePath,
            m.SortOrder,
            m.Email,
            m.Category,
            m.CreatedAt
        })
        .ToListAsync();
    return Results.Ok(members);
});

app.MapGet("/public/past-winners", async (InnovationDbContext db) =>
{
    var winners = await db.PastWinners.OrderByDescending(w => w.Year).ThenBy(w => w.Category).ToListAsync();
    return Results.Ok(winners);
});

auth.MapPost("/refresh", async (HttpContext ctx, InnovationDbContext db, JwtService jwt) =>
{
    var body = await ctx.Request.ReadFromJsonAsync<Dictionary<string, string>>();
    var tk = body?.GetValueOrDefault("refresh_token");
    if (string.IsNullOrWhiteSpace(tk)) return Results.BadRequest(new { message = "refresh_token required" });
    var r = await jwt.RefreshAsync(tk); if (r == null) return Results.Unauthorized();
    return Results.Ok(new { access_token = r.Value.access, refresh_token = r.Value.refresh });
});

auth.MapPost("/logout", async (HttpContext ctx, JwtService jwt) =>
{
    var uid = GetUid(ctx); if (uid != null) await jwt.RevokeAllAsync(uid.Value);
    return Results.Ok(new { message = "Logged out" });
}).RequireAuthorization();

auth.MapGet("/me", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var u = await db.Users.FindAsync(uid.Value); if (u == null) return Results.NotFound();
    return Results.Ok(new { id = u.Id, title = u.Title, first_name = u.FirstName, middle_name = u.MiddleName, last_name = u.LastName,
        dob = u.Dob, gender = u.Gender, email = u.Email, mobile = u.Mobile, role = u.Role });
}).RequireAuthorization();

// ========== APPLICATION ==========
var api = app.MapGroup("").RequireAuthorization().RequireRateLimiting("api");

api.MapPost("/application/create", async (HttpContext ctx, InnovationDbContext db, AuditService audit) =>
{
    try
    {
        var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
        var existing = await db.Applications.FirstOrDefaultAsync(a => a.UserId == uid.Value);
        if (existing != null)
        {
            return Results.Ok(new { id = existing.Id, status = existing.Status });
        }
        var a = new Application { UserId = uid.Value, Status = "DRAFT", CreatedAt = DateTime.UtcNow };
        db.Applications.Add(a); await db.SaveChangesAsync();
        await audit.LogAsync(uid, "CREATE_APP", "Application", a.Id, null, GetIp(ctx));
        return Results.Ok(new { id = a.Id, status = a.Status });
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Error in /application/create");
        return Results.BadRequest(new { message = $"Failed to initialize application: {ex.InnerException?.Message ?? ex.Message}" });
    }
});

api.MapGet("/application/mine", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    var a = await db.Applications.Include(x => x.PersonalInfo).Include(x => x.CompanyReach)
        .Include(x => x.CompanyDetail).Include(x => x.FileUploads)
        .FirstOrDefaultAsync(x => x.UserId == uid.Value);

    if (a == null)
    {
        a = new Application { UserId = uid.Value, Status = "DRAFT", CreatedAt = DateTime.UtcNow };
        db.Applications.Add(a);
        await db.SaveChangesAsync();
    }

    return Results.Ok(new {
        id = a.Id,
        status = a.Status,
        submitted_at = a.SubmittedAt,
        user = user == null ? null : new {
            first_name = user.FirstName,
            last_name = user.LastName,
            email = user.Email,
            mobile = user.Mobile,
            gender = user.Gender,
            organisation = user.Organisation
        },
        personal_info = a.PersonalInfo == null ? null : new {
            award_category = a.PersonalInfo.CategoryOfWork,
            company_name = a.PersonalInfo.CompanyName,
            designation = a.PersonalInfo.Designation,
            company_website = a.PersonalInfo.CompanyWebsite,
            company_brief = a.PersonalInfo.CompanyBrief,
            innovation = a.PersonalInfo.Innovation,
            competitive_analysis = a.PersonalInfo.CompetitiveAnalysis,
            need_analysis = a.PersonalInfo.NeedAnalysis,
            marketability = a.PersonalInfo.Marketability
        },
        company_reach = a.CompanyReach == null ? null : new {
            marketing_strategy = a.CompanyReach.MarketingStrategy,
            app_details = a.CompanyReach.AppDetails,
            website_details = a.CompanyReach.WebsiteDetails,
            social_media = a.CompanyReach.SocialMedia
        },
        company_detail = a.CompanyDetail == null ? null : new {
            customer_benefit = a.CompanyDetail.CustomerBenefit,
            employee_count = a.CompanyDetail.EmployeeCount
        },
        file_uploads = a.FileUploads.Select(f => new { f.Id, f.Section, f.FileName, f.FilePath, f.FileSize, f.FileType })
    });
});

api.MapPost("/application/save/{appId}", async (int appId, HttpContext ctx, ApplicationSaveDto dto, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var a = await db.Applications.Include(x => x.PersonalInfo)
        .FirstOrDefaultAsync(x => x.Id == appId && x.UserId == uid.Value);
    if (a == null) return Results.NotFound();

    if (a.PersonalInfo == null) {
        a.PersonalInfo = new PersonalInfo { ApplicationId = appId };
        db.PersonalInfos.Add(a.PersonalInfo);
    }
    a.PersonalInfo.CategoryOfWork = dto.AwardCategory;
    a.PersonalInfo.CompanyName = dto.OrganisationName;
    a.PersonalInfo.Designation = dto.Designation;
    a.PersonalInfo.CompanyBrief = dto.BriefDescription;

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Application saved successfully" });
});

api.MapPost("/application/upload/{appId}/{section}", async (int appId, string section, HttpRequest req, InnovationDbContext db, IStorageService storage) =>
{
    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();
    var files = form.Files;
    if (files.Count == 0) return Results.BadRequest(new { message = "No files uploaded" });

    var uploadedFiles = new List<object>();
    foreach (var file in files)
    {
        var ext = Path.GetExtension(file.FileName).ToLower();
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var fUrl = await storage.UploadFileAsync(file, appId.ToString(), uniqueName);

        var fDb = new FileUpload { ApplicationId = appId, Section = section, FileName = file.FileName, FilePath = fUrl, FileSize = (int)file.Length, FileType = ext, CreatedAt = DateTime.UtcNow };
        db.FileUploads.Add(fDb);
        await db.SaveChangesAsync();
        uploadedFiles.Add(new { fDb.Id, fDb.Section, fDb.FileName, fDb.FilePath, fDb.FileSize, fDb.FileType });
    }
    return Results.Ok(new { message = "Files uploaded", files = uploadedFiles });
});

api.MapDelete("/application/upload/{fileId}", async (int fileId, InnovationDbContext db, IStorageService storage) =>
{
    var f = await db.FileUploads.FindAsync(fileId);
    if (f == null) return Results.NotFound();
    await storage.DeleteFileAsync(f.FilePath);
    db.FileUploads.Remove(f);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "File deleted" });
});

api.MapPost("/application/submit/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit, EmailService emailService) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var a = await db.Applications.Include(x => x.User).Include(x => x.PersonalInfo).FirstOrDefaultAsync(x => x.Id == appId && x.UserId == uid.Value);
    if (a == null) return Results.NotFound();

    // Enforce "An OPPI member company - Only 1 entry per member company per category"
    var companyName = (a.PersonalInfo?.CompanyName ?? a.User?.Organisation ?? "").Trim();
    var category = (a.PersonalInfo?.CategoryOfWork ?? "").Trim();
    if (!string.IsNullOrEmpty(companyName) && !string.IsNullOrEmpty(category))
    {
        var duplicateSubmission = await db.Applications
            .Include(x => x.PersonalInfo)
            .Include(x => x.User)
            .Where(x => x.Id != appId && x.Status == "SUBMITTED")
            .AnyAsync(x => 
                ((x.PersonalInfo != null && x.PersonalInfo.CompanyName != null && x.PersonalInfo.CompanyName.Trim().ToLower() == companyName.ToLower()) ||
                 (x.User != null && x.User.Organisation != null && x.User.Organisation.Trim().ToLower() == companyName.ToLower()))
                &&
                (x.PersonalInfo != null && x.PersonalInfo.CategoryOfWork != null && x.PersonalInfo.CategoryOfWork.Trim().ToLower() == category.ToLower())
            );

        if (duplicateSubmission)
        {
            return Results.BadRequest(new { 
                message = $"An application has already been submitted for member company '{companyName}' in category '{category}'. Only one entry per member company per category is permitted." 
            });
        }
    }

    a.Status = "SUBMITTED";
    a.SubmittedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid, "SUBMIT_APP", "Application", appId, null, GetIp(ctx));

    try
    {
        if (a.User != null)
        {
            var displayName = $"{a.User.FirstName} {a.User.LastName}".Trim();
            await emailService.SendApplicationSubmissionEmailAsync(a.User.Email, displayName, a.Id);
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to send application submission confirmation email for App #{AppId}", a.Id);
    }

    return Results.Ok(new { message = "Application submitted successfully" });
});

api.MapGet("/application/review/{id}", async (int id, HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN" && user?.Role != "VALIDATOR" && user?.Role != "JURY" && user?.Role != "PANEL_CHAIR")
        return Results.Forbid();

    var a = await db.Applications.Include(x => x.User)
        .FirstOrDefaultAsync(x => x.Id == id);
    if (a == null) return Results.NotFound(new { message = "Application not found" });

    var applicant = await db.ApplicantDetails.FirstOrDefaultAsync(x => x.ApplicationId == id);
    var appDetail = await db.ApplicationDetails.Include(x => x.Patents).FirstOrDefaultAsync(x => x.ApplicationId == id);

    var userRole = user?.Role;

    // 1. Validator reviews visibility
    object? validatorReviewDto = null;
    if (userRole == "ADMIN" || userRole == "PANEL_CHAIR")
    {
        validatorReviewDto = await db.ValidatorReviews
            .Where(vr => vr.ApplicationId == id && !vr.IsDraft)
            .Select(vr => new {
                vr.Id,
                vr.ValidatorId,
                validator_name = db.Users.Where(u => u.Id == vr.ValidatorId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault() ?? "Validator",
                vr.InnovationIpScore,
                vr.TeamStrengthScore,
                vr.BusinessPlanScore,
                vr.ImpactScore,
                vr.WeightedScore,
                vr.Comments,
                vr.CreatedAt
            })
            .ToListAsync();
    }
    else if (userRole == "VALIDATOR")
    {
        var vr = await db.ValidatorReviews
            .FirstOrDefaultAsync(vr => vr.ApplicationId == id && vr.ValidatorId == uid.Value);
        if (vr != null)
        {
            validatorReviewDto = new {
                vr.Id,
                vr.ValidatorId,
                vr.InnovationIpScore,
                vr.TeamStrengthScore,
                vr.BusinessPlanScore,
                vr.ImpactScore,
                vr.WeightedScore,
                vr.Comments,
                vr.IsDraft,
                vr.CreatedAt
            };
        }
    }

    // 2. Jury reviews visibility
    object? juryReviewsDto = null;
    double avgScore = 0.0;
    int juryApprovalCount = 0;

    if (userRole == "ADMIN" || userRole == "PANEL_CHAIR")
    {
        var reviews = await db.JuryReviews
            .Where(jr => jr.ApplicationId == id && !jr.IsDraft)
            .Select(jr => new {
                jr.Id,
                jr.JuryId,
                jury_name = db.Users.Where(u => u.Id == jr.JuryId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault() ?? "Jury",
                jr.InnovationIpScore,
                jr.TeamStrengthScore,
                jr.BusinessPlanScore,
                jr.ImpactScore,
                jr.WeightedScore,
                jr.Comments,
                jr.CreatedAt
            })
            .ToListAsync();
        juryReviewsDto = reviews;
        avgScore = reviews.Any() ? reviews.Average(r => r.WeightedScore) : 0.0;
        juryApprovalCount = reviews.Count;
    }
    else if (userRole == "JURY")
    {
        var jr = await db.JuryReviews
            .FirstOrDefaultAsync(jr => jr.ApplicationId == id && jr.JuryId == uid.Value);
        if (jr != null)
        {
            juryReviewsDto = new[] {
                new {
                    jr.Id,
                    jr.JuryId,
                    jury_name = user.FirstName + " " + user.LastName,
                    jr.InnovationIpScore,
                    jr.TeamStrengthScore,
                    jr.BusinessPlanScore,
                    jr.ImpactScore,
                    jr.WeightedScore,
                    jr.Comments,
                    jr.IsDraft,
                    jr.CreatedAt
                }
            };
            if (!jr.IsDraft)
            {
                avgScore = jr.WeightedScore;
                juryApprovalCount = 1;
            }
        }
    }

    var pInfo = await db.PersonalInfos.FirstOrDefaultAsync(x => x.ApplicationId == id);
    var fileUploads = await db.FileUploads.Where(x => x.ApplicationId == id).ToListAsync();

    return Results.Ok(new {
        id = a.Id, status = a.Status, submitted_at = a.SubmittedAt,
        user_name = a.User?.FirstName + " " + a.User?.LastName,
        user_email = a.User?.Email,
        user_mobile = a.User?.Mobile,
        user_organisation = a.User?.Organisation,
        personal_info = pInfo == null ? null : new {
            award_category = pInfo.CategoryOfWork,
            company_name = pInfo.CompanyName ?? a.User?.Organisation,
            designation = pInfo.Designation,
            company_brief = pInfo.CompanyBrief
        },
        file_uploads = fileUploads.Select(f => new {
            f.Id, f.Section, f.FileName, f.FilePath, f.FileSize, f.FileType
        }),
        applicant_detail = applicant != null ? (object)new {
            applicant.PhotoPath, applicant.Title, applicant.FirstName, applicant.MiddleName, applicant.LastName,
            applicant.Dob, applicant.Gender, applicant.Email, applicant.Telephone, applicant.Mobile,
            applicant.Discipline, applicant.InstituteCategory, applicant.InstituteName
        } : new {
            PhotoPath = (string?)null, Title = a.User?.Title, FirstName = a.User?.FirstName, MiddleName = a.User?.MiddleName, LastName = a.User?.LastName,
            Dob = a.User?.Dob, Gender = a.User?.Gender, Email = a.User?.Email, Telephone = (string?)null, Mobile = a.User?.Mobile,
            Discipline = (string?)null, InstituteCategory = "OPPI Member Company", InstituteName = pInfo?.CompanyName ?? a.User?.Organisation ?? ""
        },
        application_detail = appDetail != null ? (object)new {
            appDetail.Id, appDetail.Category, appDetail.BriefStatement, appDetail.SignificantContribution,
            appDetail.ImpactContribution, appDetail.HasPatent, appDetail.HasPublication, appDetail.CvFilePath, appDetail.CvFileName,
            appDetail.AuthCertFilePath, appDetail.AuthCertFileName,
            patents = appDetail.Patents.OrderBy(p => p.SortOrder).Select(p => {
                var path = p.AttachmentPath;
                if (string.IsNullOrWhiteSpace(path) && (p.HasAttachment == true || !string.IsNullOrWhiteSpace(p.AttachmentFileName)))
                {
                    var appFolder = Path.Combine(uploadsDir, id.ToString());
                    if (Directory.Exists(appFolder))
                    {
                        var files = Directory.GetFiles(appFolder)
                            .Where(f => {
                                var fn = Path.GetFileName(f).ToLower();
                                return !fn.StartsWith("cv_") && !fn.StartsWith("auth_");
                            }).ToList();
                        if (files.Any())
                        {
                            var matched = string.IsNullOrWhiteSpace(p.AttachmentFileName)
                                ? null
                                : files.FirstOrDefault(f => Path.GetFileName(f).Equals(p.AttachmentFileName, StringComparison.OrdinalIgnoreCase));
                            if (matched != null)
                            {
                                path = $"/uploads/{id}/{Path.GetFileName(matched)}";
                            }
                        }
                    }
                }
                return new {
                    p.Id, p.Title, p.Type, p.HasAttachment, AttachmentPath = path, p.AttachmentFileName, p.IsPrimaryWriter, p.SortOrder
                };
            })
        } : new {
            Id = a.Id,
            Category = pInfo?.CategoryOfWork,
            BriefStatement = pInfo?.CompanyBrief,
            SignificantContribution = (string?)null,
            ImpactContribution = (string?)null,
            HasPatent = false,
            HasPublication = false,
            CvFilePath = (string?)null,
            CvFileName = (string?)null,
            AuthCertFilePath = (string?)null,
            AuthCertFileName = (string?)null,
            patents = new object[0]
        },
        validator_review = validatorReviewDto,
        jury_reviews = juryReviewsDto,
        average_score = avgScore,
        jury_approval_count = juryApprovalCount,
        rejection_reason = a.RejectionReason
    });
});

// ========== ADMIN ==========
api.MapPost("/admin/reminders/trigger", async (HttpContext ctx, InnovationDbContext db, ReminderEmailBackgroundService reminderService) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    reminderService.TriggerImmediateRun();
    return Results.Ok(new { message = "Reminder email check triggered successfully" });
});

api.MapGet("/admin/users", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();
    var users = await db.Users.Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.Mobile, u.Organisation, u.Role, u.CreatedAt }).ToListAsync();
    return Results.Ok(users);
});

api.MapGet("/admin/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var rawApps = await db.Applications.Include(a => a.User)
        .OrderByDescending(a => a.Status != "DRAFT")
        .ThenByDescending(a => a.Id)
        .ToListAsync();

    // Deduplicate by UserId so each user has a single application entry
    var uniqueApps = rawApps.GroupBy(a => a.UserId).Select(g => g.First()).ToList();

    var apps = uniqueApps.Select(a => {
        var pInfo = db.PersonalInfos.FirstOrDefault(p => p.ApplicationId == a.Id);
        var appName = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
            .Select(ad => ad.FirstName + " " + ad.LastName).FirstOrDefault();
        if (string.IsNullOrWhiteSpace(appName))
            appName = $"{a.User.FirstName} {a.User.LastName}".Trim();

        var appEmail = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
            .Select(ad => ad.Email).FirstOrDefault();
        if (string.IsNullOrWhiteSpace(appEmail))
            appEmail = a.User.Email;

        var comp = pInfo?.CompanyName;
        if (string.IsNullOrWhiteSpace(comp))
            comp = a.User.Organisation;
        if (string.IsNullOrWhiteSpace(comp))
            comp = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id).Select(ad => ad.InstituteName).FirstOrDefault() ?? "";

        var cat = pInfo?.CategoryOfWork;
        if (string.IsNullOrWhiteSpace(cat))
            cat = db.ApplicationDetails.Where(apd => apd.Category != null && apd.ApplicationId == a.Id).Select(apd => apd.Category).FirstOrDefault();

        return new {
            a.Id, a.Status, a.SubmittedAt,
            user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email,
            applicant_name = appName,
            applicant_email = appEmail,
            company = comp,
            institute_name = comp,
            category = cat,
            designation = pInfo?.Designation ?? "",
            brief_description = pInfo?.CompanyBrief ?? "",
            has_validator_review = db.ValidatorReviews.Any(vr => vr.ApplicationId == a.Id && !vr.IsDraft),
            validator_score = db.ValidatorReviews.Where(vr => vr.ApplicationId == a.Id && !vr.IsDraft).Average(vr => (double?)vr.WeightedScore) ?? 0.0,
            jury_approval_count = db.JuryReviews.Count(jr => jr.ApplicationId == a.Id),
            average_score = db.JuryReviews.Where(jr => jr.ApplicationId == a.Id).Average(jr => (double?)jr.WeightedScore) ?? 0.0
        };
    }).ToList();

    return Results.Ok(apps);
});

api.MapGet("/admin/panel-chair-report", async (HttpContext ctx, InnovationDbContext db) =>
{
    try
    {
        var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
        var user = await db.Users.FindAsync(uid.Value);
        var role = user?.Role?.ToUpper() ?? "";
        if (role != "ADMIN" && role != "PANEL_CHAIR" && role != "SUPER_ADMIN") return Results.Forbid();

        var allPanelMembers = await db.PanelMembers.ToListAsync();
        var allUsers = await db.Users.ToListAsync();
        var allApplications = await db.Applications.ToListAsync();
        var appDetails = await db.ApplicationDetails.ToListAsync();
        var applicantDetails = await db.ApplicantDetails.ToListAsync();
        var allReviews = await db.JuryReviews.ToListAsync();

        var panelJuries = allPanelMembers
            .Where(pm => !string.IsNullOrEmpty(pm.Type) && pm.Type.Trim().Equals("JURY", StringComparison.OrdinalIgnoreCase))
            .OrderBy(pm => pm.SortOrder)
            .ToList();

        var juriesList = new List<object>();

        foreach (var pm in panelJuries)
        {
            var matchingUsers = allUsers.Where(u =>
                (!string.IsNullOrEmpty(u.Email) && !string.IsNullOrEmpty(pm.Email) && u.Email.Trim().Equals(pm.Email.Trim(), StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(u.FirstName) && !string.IsNullOrEmpty(pm.Name) && u.FirstName.Trim().Equals(pm.Name.Trim(), StringComparison.OrdinalIgnoreCase))
            ).ToList();

            var ids = matchingUsers.Select(u => u.Id).ToList();
            if (!ids.Contains(pm.Id)) ids.Add(pm.Id);

            int primaryId = matchingUsers.FirstOrDefault()?.Id ?? pm.Id;

            juriesList.Add(new {
                id = primaryId,
                userIds = ids,
                name = pm.Name,
                email = pm.Email ?? ""
            });
        }

        if (!juriesList.Any())
        {
            var juryUsers = allUsers.Where(u => !string.IsNullOrEmpty(u.Role) && u.Role.Trim().Equals("JURY", StringComparison.OrdinalIgnoreCase)).ToList();
            foreach (var ju in juryUsers)
            {
                juriesList.Add(new {
                    id = ju.Id,
                    userIds = new List<int> { ju.Id },
                    name = ((ju.Title != null ? ju.Title + " " : "") + (ju.FirstName ?? "") + (string.IsNullOrWhiteSpace(ju.LastName) ? "" : " " + ju.LastName)).Trim(),
                    email = ju.Email
                });
            }
        }

        var approvedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "VALIDATOR_APPROVED", "UNDER_JURY_REVIEW", "JURY_APPROVED", "PANEL_APPROVED" };
        var appsList = allApplications
            .Where(a => (!string.IsNullOrEmpty(a.Status) && (approvedStatuses.Contains(a.Status) || a.Status.EndsWith("_APPROVED", StringComparison.OrdinalIgnoreCase))))
            .ToList();

        var apps = appsList.Select(a => {
            var appDet = appDetails.FirstOrDefault(ad => ad.ApplicationId == a.Id);
            var applDet = applicantDetails.FirstOrDefault(ad => ad.ApplicationId == a.Id);
            var appUser = allUsers.FirstOrDefault(u => u.Id == a.UserId);

            string name = "Applicant #" + a.Id;
            if (applDet != null && (!string.IsNullOrEmpty(applDet.FirstName) || !string.IsNullOrEmpty(applDet.LastName)))
            {
                name = ((applDet.Title != null ? applDet.Title + " " : "") + (applDet.FirstName ?? "") + " " + (applDet.LastName ?? "")).Trim();
            }
            else if (appUser != null)
            {
                name = ((appUser.FirstName ?? "") + " " + (appUser.LastName ?? "")).Trim();
            }

            string category = appDet?.Category ?? applDet?.Discipline ?? "OPPI Scientist of the Year";

            return new {
                id = a.Id,
                status = a.Status,
                applicant_name = name,
                category = category
            };
        }).ToList();

        var reviews = allReviews.Select(jr => new {
            application_id = jr.ApplicationId,
            jury_id = jr.JuryId,
            weighted_score = jr.WeightedScore > 0 ? jr.WeightedScore : (jr.InnovationIpScore + jr.TeamStrengthScore + jr.BusinessPlanScore + jr.ImpactScore),
            is_draft = jr.IsDraft
        }).ToList();

        return Results.Ok(new {
            juries = juriesList,
            applications = apps,
            reviews
        });
    }
    catch (Exception ex)
    {
        Serilog.Log.Error(ex, "Error generating panel chair report");
        return Results.Problem("Failed to generate panel chair report: " + (ex.InnerException?.Message ?? ex.Message));
    }
});

api.MapPost("/admin/panel-members", async (PanelMemberDto dto, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Role) || string.IsNullOrWhiteSpace(dto.Type) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.ImagePath))
    {
        return Results.BadRequest(new { message = "Name, Role, Type, Email, Password, and Photo upload are required." });
    }

    var pwdRegex = new System.Text.RegularExpressions.Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$");
    if (!pwdRegex.IsMatch(dto.Password.Trim()))
    {
        return Results.BadRequest(new { message = "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number." });
    }

    var member = new PanelMember
    {
        Name = dto.Name,
        Role = dto.Role,
        Type = dto.Type.ToUpper(),
        ImagePath = dto.ImagePath,
        SortOrder = dto.SortOrder,
        Email = dto.Email.Trim(),
        Password = null,
        CreatedAt = DateTime.UtcNow
    };

    db.PanelMembers.Add(member);

    // Sync with users table
    var matchingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.Trim());
    if (matchingUser == null)
    {
        var newUser = new User
        {
            FirstName = dto.Name,
            LastName = "",
            Email = dto.Email.Trim(),
            Role = dto.Type.ToUpper(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim()),
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(newUser);
    }
    else
    {
        matchingUser.FirstName = dto.Name;
        matchingUser.Role = dto.Type.ToUpper();
        matchingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Panel member created successfully", member });
});

api.MapPut("/admin/panel-members/{id}", async (int id, PanelMemberDto dto, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var member = await db.PanelMembers.FindAsync(id);
    if (member == null) return Results.NotFound();

    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Role) || string.IsNullOrWhiteSpace(dto.Type) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.ImagePath))
    {
        return Results.BadRequest(new { message = "Name, Role, Type, Email, and Photo upload are required." });
    }

    var pwdRegex = new System.Text.RegularExpressions.Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$");
    if (!string.IsNullOrWhiteSpace(dto.Password) && !pwdRegex.IsMatch(dto.Password.Trim()))
    {
        return Results.BadRequest(new { message = "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number." });
    }

    var oldEmail = member.Email;

    member.Name = dto.Name;
    member.Role = dto.Role;
    member.Type = dto.Type.ToUpper();
    member.ImagePath = dto.ImagePath;
    member.SortOrder = dto.SortOrder;
    member.Email = dto.Email.Trim();
    member.Password = null;

    // Sync with users table
    User? matchingUser = null;
    if (!string.IsNullOrWhiteSpace(oldEmail))
    {
        matchingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == oldEmail.Trim());
    }
    if (matchingUser == null)
    {
        matchingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.Trim());
    }

    if (matchingUser == null)
    {
        var newUser = new User
        {
            FirstName = dto.Name,
            LastName = "",
            Email = dto.Email.Trim(),
            Role = dto.Type.ToUpper(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrWhiteSpace(dto.Password) ? "Password123!" : dto.Password.Trim()),
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(newUser);
    }
    else
    {
        matchingUser.FirstName = dto.Name;
        matchingUser.Email = dto.Email.Trim();
        matchingUser.Role = dto.Type.ToUpper();
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            matchingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
        }
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Panel member updated successfully", member });
});

api.MapDelete("/admin/panel-members/{id}", async (int id, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var member = await db.PanelMembers.FindAsync(id);
    if (member == null) return Results.NotFound();

    // Sync deletion with users table
    if (!string.IsNullOrWhiteSpace(member.Email))
    {
        var matchingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == member.Email.Trim());
        if (matchingUser != null)
        {
            db.Users.Remove(matchingUser);
        }
    }

    db.PanelMembers.Remove(member);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Panel member deleted successfully" });
});

api.MapDelete("/admin/applications/{appId}", async (int appId, InnovationDbContext db, IStorageService storage, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var a = await db.Applications.FindAsync(appId);
    if (a == null) return Results.NotFound();

    // Delete PersonalInfo
    var personalInfo = await db.PersonalInfos.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (personalInfo != null) db.PersonalInfos.Remove(personalInfo);

    // Delete CompanyReach
    var companyReach = await db.CompanyReaches.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (companyReach != null) db.CompanyReaches.Remove(companyReach);

    // Delete CompanyDetail
    var companyDetail = await db.CompanyDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (companyDetail != null) db.CompanyDetails.Remove(companyDetail);

    // Delete FileUploads and their physical files
    var fileUploads = await db.FileUploads.Where(x => x.ApplicationId == appId).ToListAsync();
    foreach (var fu in fileUploads)
    {
        if (!string.IsNullOrWhiteSpace(fu.FilePath))
        {
            await storage.DeleteFileAsync(fu.FilePath);
        }
    }
    db.FileUploads.RemoveRange(fileUploads);

    // Delete JuryReviews
    var juryReviews = await db.JuryReviews.Where(x => x.ApplicationId == appId).ToListAsync();
    db.JuryReviews.RemoveRange(juryReviews);

    // Delete ValidatorReviews
    var validatorReviews = await db.ValidatorReviews.Where(x => x.ApplicationId == appId).ToListAsync();
    db.ValidatorReviews.RemoveRange(validatorReviews);

    // Delete ApplicantDetail and its photo
    var applicantDetail = await db.ApplicantDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (applicantDetail != null)
    {
        if (!string.IsNullOrWhiteSpace(applicantDetail.PhotoPath))
        {
            await storage.DeleteFileAsync(applicantDetail.PhotoPath);
        }
        db.ApplicantDetails.Remove(applicantDetail);
    }

    // Delete ApplicationDetail, its CV and AuthCert, and Patents (with attachments)
    var appDetail = await db.ApplicationDetails.Include(ad => ad.Patents).FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (appDetail != null)
    {
        if (!string.IsNullOrWhiteSpace(appDetail.CvFilePath))
        {
            await storage.DeleteFileAsync(appDetail.CvFilePath);
        }
        if (!string.IsNullOrWhiteSpace(appDetail.AuthCertFilePath))
        {
            await storage.DeleteFileAsync(appDetail.AuthCertFilePath);
        }
        foreach (var p in appDetail.Patents)
        {
            if (!string.IsNullOrWhiteSpace(p.AttachmentPath))
            {
                await storage.DeleteFileAsync(p.AttachmentPath);
            }
        }
        db.Patents.RemoveRange(appDetail.Patents);
        db.ApplicationDetails.Remove(appDetail);
    }

    // Delete the application itself
    db.Applications.Remove(a);
    await db.SaveChangesAsync();

    // Log audit
    await audit.LogAsync(uid.Value, "DELETE_APPLICATION", "Application", appId, null, GetIp(ctx));

    return Results.Ok(new { message = "Application deleted successfully" });
});

api.MapPost("/admin/panel-members/upload", async (HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var files = req.Form.Files;
    if (files.Count == 0) return Results.BadRequest(new { message = "No file uploaded" });

    var file = files[0];
    var ext = Path.GetExtension(file.FileName).ToLower();
    var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
    if (!allowed.Contains(ext)) return Results.BadRequest(new { message = "Invalid image type" });

    var uniqueName = $"panel_{Guid.NewGuid()}{ext}";
    var url = await storage.UploadFileAsync(file, "panel", uniqueName);
    return Results.Ok(new { message = "Image uploaded successfully", url });
});

api.MapPost("/admin/past-winners", async (PastWinnerDto dto, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Category) || dto.Year <= 0)
    {
        return Results.BadRequest(new { message = "Name, Description, Category and Year are required." });
    }

    int currentYear = DateTime.UtcNow.Year;
    if (dto.Year > currentYear)
    {
        return Results.BadRequest(new { message = $"Award Year cannot be in the future (maximum allowed is {currentYear})." });
    }

    var winner = new PastWinner
    {
        Year = dto.Year,
        Category = dto.Category,
        Name = dto.Name,
        Description = dto.Description,
        ImagePath = dto.ImagePath,
        Color = dto.Color,
        CreatedAt = DateTime.UtcNow
    };

    db.PastWinners.Add(winner);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Past winner created successfully", winner });
});

api.MapPut("/admin/past-winners/{id}", async (int id, PastWinnerDto dto, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var winner = await db.PastWinners.FindAsync(id);
    if (winner == null) return Results.NotFound();

    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Category) || dto.Year <= 0)
    {
        return Results.BadRequest(new { message = "Name, Description, Category and Year are required." });
    }

    int currentYear = DateTime.UtcNow.Year;
    if (dto.Year > currentYear)
    {
        return Results.BadRequest(new { message = $"Award Year cannot be in the future (maximum allowed is {currentYear})." });
    }

    winner.Year = dto.Year;
    winner.Category = dto.Category;
    winner.Name = dto.Name;
    winner.Description = dto.Description;
    winner.ImagePath = dto.ImagePath;
    winner.Color = dto.Color;

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Past winner updated successfully", winner });
});

api.MapDelete("/admin/past-winners/{id}", async (int id, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var winner = await db.PastWinners.FindAsync(id);
    if (winner == null) return Results.NotFound();

    db.PastWinners.Remove(winner);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Past winner deleted successfully" });
});

api.MapPost("/admin/past-winners/upload", async (HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var files = req.Form.Files;
    if (files.Count == 0) return Results.BadRequest(new { message = "No file uploaded" });

    var file = files[0];
    var ext = Path.GetExtension(file.FileName).ToLower();
    var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
    if (!allowed.Contains(ext)) return Results.BadRequest(new { message = "Invalid image type" });

    var uniqueName = $"winner_{Guid.NewGuid()}{ext}";
    var url = await storage.UploadFileAsync(file, "winner", uniqueName);
    return Results.Ok(new { message = "Image uploaded successfully", url });
});

// ========== VALIDATOR ==========
api.MapGet("/validator/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "VALIDATOR" && user?.Role != "ADMIN") return Results.Forbid();

    var apps = await db.Applications.Include(a => a.User)
        .Where(a => a.Status == "SUBMITTED" || a.ValidatorId == uid.Value)
        .Select(a => new {
            a.Id, a.Status, a.SubmittedAt,
            user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email,
            applicant_name = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
                .Select(ad => ad.FirstName + " " + ad.LastName).FirstOrDefault(),
            category = db.ApplicationDetails.Where(apd => apd.ApplicationId == a.Id)
                .Select(apd => apd.Category).FirstOrDefault(),
            institute_name = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
                .Select(ad => ad.InstituteName).FirstOrDefault() ?? ""
        })
        .ToListAsync();

    var validatorReviews = await db.ValidatorReviews
        .Where(vr => vr.ValidatorId == uid.Value)
        .ToDictionaryAsync(vr => vr.ApplicationId);

    var result = apps.Select(a => {
        var hasReview = validatorReviews.TryGetValue(a.Id, out var vr);
        return new {
            a.Id, a.Status, a.SubmittedAt,
            a.user_name, a.user_email, a.applicant_name, a.category, a.institute_name,
            review = hasReview ? new {
                vr.InnovationIpScore,
                vr.TeamStrengthScore,
                vr.BusinessPlanScore,
                vr.ImpactScore,
                vr.WeightedScore,
                vr.Comments,
                vr.IsDraft
            } : null
        };
    }).ToList();

    return Results.Ok(result);
});

api.MapPost("/validator/save-draft/{appId}", async (int appId, ValidatorEvaluationDto dto, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "VALIDATOR") return Results.Forbid();

    var a = await db.Applications.FindAsync(appId);
    if (a == null) return Results.NotFound();

    if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 30 ||
        dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 25 ||
        dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 25 ||
        dto.ImpactScore < 0 || dto.ImpactScore > 20)
    {
        return Results.BadRequest(new { message = "Scores exceed maximum bounds (Innovation: 30, Approach: 25, Nature Innovation: 25, Credentials: 20)." });
    }

    var vr = await db.ValidatorReviews.FirstOrDefaultAsync(x => x.ApplicationId == appId && x.ValidatorId == uid.Value);
    double weightedScore = dto.InnovationIpScore + dto.TeamStrengthScore + dto.BusinessPlanScore + dto.ImpactScore;
    
    if (vr == null)
    {
        vr = new ValidatorReview
        {
            ApplicationId = appId,
            ValidatorId = uid.Value,
            InnovationIpScore = dto.InnovationIpScore,
            TeamStrengthScore = dto.TeamStrengthScore,
            BusinessPlanScore = dto.BusinessPlanScore,
            ImpactScore = dto.ImpactScore,
            WeightedScore = weightedScore,
            Comments = dto.Comments,
            IsDraft = true,
            CreatedAt = DateTime.UtcNow
        };
        db.ValidatorReviews.Add(vr);
    }
    else
    {
        vr.InnovationIpScore = dto.InnovationIpScore;
        vr.TeamStrengthScore = dto.TeamStrengthScore;
        vr.BusinessPlanScore = dto.BusinessPlanScore;
        vr.ImpactScore = dto.ImpactScore;
        vr.WeightedScore = weightedScore;
        vr.Comments = dto.Comments;
        vr.IsDraft = true;
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Draft scores saved" });
});

api.MapPost("/validator/approve/{appId}", async (int appId, ValidatorEvaluationDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "VALIDATOR") return Results.Forbid();

    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();

    if (string.IsNullOrWhiteSpace(dto.Comments))
    {
        return Results.BadRequest(new { message = "Remarks are mandatory when approving the application." });
    }

    a.Status = "VALIDATOR_APPROVED"; a.ValidatorId = uid.Value; a.ValidatorActionAt = DateTime.UtcNow;

    if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 30 ||
        dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 25 ||
        dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 25 ||
        dto.ImpactScore < 0 || dto.ImpactScore > 20)
    {
        return Results.BadRequest(new { message = "Scores must be within valid limits (Innovation: 0-30, Approach: 0-25, Nature Innovation: 0-25, Credentials: 0-20)." });
    }

    var vr = await db.ValidatorReviews.FirstOrDefaultAsync(x => x.ApplicationId == appId && x.ValidatorId == uid.Value);
    double weightedScore = dto.InnovationIpScore + dto.TeamStrengthScore + dto.BusinessPlanScore + dto.ImpactScore;
    
    if (vr == null)
    {
        vr = new ValidatorReview
        {
            ApplicationId = appId,
            ValidatorId = uid.Value,
            InnovationIpScore = dto.InnovationIpScore,
            TeamStrengthScore = dto.TeamStrengthScore,
            BusinessPlanScore = dto.BusinessPlanScore,
            ImpactScore = dto.ImpactScore,
            WeightedScore = weightedScore,
            Comments = dto.Comments,
            IsDraft = false,
            CreatedAt = DateTime.UtcNow
        };
        db.ValidatorReviews.Add(vr);
    }
    else
    {
        vr.InnovationIpScore = dto.InnovationIpScore;
        vr.TeamStrengthScore = dto.TeamStrengthScore;
        vr.BusinessPlanScore = dto.BusinessPlanScore;
        vr.ImpactScore = dto.ImpactScore;
        vr.WeightedScore = weightedScore;
        vr.Comments = dto.Comments;
        vr.IsDraft = false;
    }

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "VALIDATOR_APPROVE", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));
    return Results.Ok(new { message = "Approved" });
});

api.MapPost("/validator/reject/{appId}", async (int appId, ValidatorEvaluationDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "VALIDATOR") return Results.Forbid();

    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    a.Status = "VALIDATOR_REJECTED"; a.ValidatorId = uid.Value; a.ValidatorActionAt = DateTime.UtcNow;

    if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 30 ||
        dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 25 ||
        dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 25 ||
        dto.ImpactScore < 0 || dto.ImpactScore > 20)
    {
        return Results.BadRequest(new { message = "Scores must be within valid limits (Innovation: 0-30, Approach: 0-25, Nature Innovation: 0-25, Credentials: 0-20)." });
    }

    var vr = await db.ValidatorReviews.FirstOrDefaultAsync(x => x.ApplicationId == appId && x.ValidatorId == uid.Value);
    double weightedScore = dto.InnovationIpScore + dto.TeamStrengthScore + dto.BusinessPlanScore + dto.ImpactScore;
    
    if (vr == null)
    {
        vr = new ValidatorReview
        {
            ApplicationId = appId,
            ValidatorId = uid.Value,
            InnovationIpScore = dto.InnovationIpScore,
            TeamStrengthScore = dto.TeamStrengthScore,
            BusinessPlanScore = dto.BusinessPlanScore,
            ImpactScore = dto.ImpactScore,
            WeightedScore = weightedScore,
            Comments = dto.Comments,
            IsDraft = false,
            CreatedAt = DateTime.UtcNow
        };
        db.ValidatorReviews.Add(vr);
    }
    else
    {
        vr.InnovationIpScore = dto.InnovationIpScore;
        vr.TeamStrengthScore = dto.TeamStrengthScore;
        vr.BusinessPlanScore = dto.BusinessPlanScore;
        vr.ImpactScore = dto.ImpactScore;
        vr.WeightedScore = weightedScore;
        vr.Comments = dto.Comments;
        vr.IsDraft = false;
    }

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "VALIDATOR_REJECT", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));
    return Results.Ok(new { message = "Rejected" });
});

// ========== JURY ==========
api.MapGet("/jury/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "JURY" && user?.Role != "ADMIN") return Results.Forbid();

    var apps = await db.Applications.Include(a => a.User)
        .Where(a => a.Status != "DRAFT" && a.Status != "SUBMITTED" && a.Status != "VALIDATOR_REJECTED")
        .Select(a => new {
            a.Id, a.Status, a.SubmittedAt,
            user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email,
            applicant_name = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
                .Select(ad => ad.FirstName + " " + ad.LastName).FirstOrDefault(),
            applicant_email = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
                .Select(ad => ad.Email).FirstOrDefault() ?? a.User.Email,
            company = db.PersonalInfos.Where(pi => pi.ApplicationId == a.Id).Select(pi => pi.CompanyName).FirstOrDefault()
                ?? db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id).Select(ad => ad.InstituteName).FirstOrDefault()
                ?? "",
            institute_name = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id)
                .Select(ad => ad.InstituteName).FirstOrDefault() ?? "",
            category = db.ApplicationDetails.Where(apd => apd.ApplicationId == a.Id)
                .Select(apd => apd.Category).FirstOrDefault()
        })
        .ToListAsync();

    var juryReviews = await db.JuryReviews
        .Where(jr => jr.JuryId == uid.Value)
        .ToDictionaryAsync(jr => jr.ApplicationId);

    var result = apps.Select(a => {
        var hasReview = juryReviews.TryGetValue(a.Id, out var jr);
        return new {
            a.Id, a.Status, a.SubmittedAt,
            a.user_name, a.user_email, a.applicant_name, a.applicant_email, a.company, a.institute_name, a.category,
            review = hasReview ? new {
                jr.InnovationIpScore,
                jr.TeamStrengthScore,
                jr.BusinessPlanScore,
                jr.ImpactScore,
                jr.WeightedScore,
                jr.Comments,
                jr.IsDraft
            } : null
        };
    }).ToList();

    return Results.Ok(result);
});

api.MapPost("/jury/save-draft/{appId}", async (int appId, JuryApprovalDto dto, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "JURY") return Results.Forbid();

    var a = await db.Applications.FindAsync(appId);
    if (a == null) return Results.NotFound();
    if (a.Status != "VALIDATOR_APPROVED" && a.Status != "UNDER_JURY_REVIEW" && a.Status != "JURY_APPROVED")
    {
        return Results.BadRequest(new { message = "Application is not in a valid state for jury review." });
    }

    if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 30 ||
        dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 25 ||
        dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 25 ||
        dto.ImpactScore < 0 || dto.ImpactScore > 20)
    {
        return Results.BadRequest(new { message = "Scores exceed maximum bounds (Innovation: 30, Approach: 25, Nature Innovation: 25, Credentials: 20)." });
    }

    var jr = await db.JuryReviews.FirstOrDefaultAsync(x => x.ApplicationId == appId && x.JuryId == uid.Value);
    double weightedScore = dto.InnovationIpScore + dto.TeamStrengthScore + dto.BusinessPlanScore + dto.ImpactScore;
    
    if (jr == null)
    {
        jr = new JuryReview
        {
            ApplicationId = appId,
            JuryId = uid.Value,
            InnovationIpScore = dto.InnovationIpScore,
            TeamStrengthScore = dto.TeamStrengthScore,
            BusinessPlanScore = dto.BusinessPlanScore,
            ImpactScore = dto.ImpactScore,
            WeightedScore = weightedScore,
            Comments = dto.Comments,
            IsDraft = true,
            CreatedAt = DateTime.UtcNow
        };
        db.JuryReviews.Add(jr);
    }
    else
    {
        jr.InnovationIpScore = dto.InnovationIpScore;
        jr.TeamStrengthScore = dto.TeamStrengthScore;
        jr.BusinessPlanScore = dto.BusinessPlanScore;
        jr.ImpactScore = dto.ImpactScore;
        jr.WeightedScore = weightedScore;
        jr.Comments = dto.Comments;
        jr.IsDraft = true;
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Draft scores saved" });
});

api.MapPost("/jury/approve/{appId}", async (int appId, JuryApprovalDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "JURY") return Results.Forbid();

    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    if (a.Status != "VALIDATOR_APPROVED" && a.Status != "UNDER_JURY_REVIEW" && a.Status != "JURY_APPROVED")
    {
        return Results.BadRequest(new { message = "Application is not in a valid state for jury review." });
    }

    if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 30 ||
        dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 25 ||
        dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 25 ||
        dto.ImpactScore < 0 || dto.ImpactScore > 20)
    {
        return Results.BadRequest(new { message = "Scores must be within valid limits (Innovation: 0-30, Approach: 0-25, Nature Innovation: 0-25, Credentials: 0-20)." });
    }

    double weightedScore = dto.InnovationIpScore + dto.TeamStrengthScore + dto.BusinessPlanScore + dto.ImpactScore;

    var jr = await db.JuryReviews.FirstOrDefaultAsync(x => x.ApplicationId == appId && x.JuryId == uid.Value);
    if (jr == null)
    {
        jr = new JuryReview
        {
            ApplicationId = appId,
            JuryId = uid.Value,
            InnovationIpScore = dto.InnovationIpScore,
            TeamStrengthScore = dto.TeamStrengthScore,
            BusinessPlanScore = dto.BusinessPlanScore,
            ImpactScore = dto.ImpactScore,
            WeightedScore = weightedScore,
            Comments = dto.Comments,
            IsDraft = false,
            CreatedAt = DateTime.UtcNow
        };
        db.JuryReviews.Add(jr);
    }
    else
    {
        if (!jr.IsDraft)
        {
            return Results.BadRequest(new { message = "You have already finalized your score for this application." });
        }
        jr.InnovationIpScore = dto.InnovationIpScore;
        jr.TeamStrengthScore = dto.TeamStrengthScore;
        jr.BusinessPlanScore = dto.BusinessPlanScore;
        jr.ImpactScore = dto.ImpactScore;
        jr.WeightedScore = weightedScore;
        jr.Comments = dto.Comments;
        jr.IsDraft = false;
    }

    await db.SaveChangesAsync();

    var finalizedReviewsCount = await db.JuryReviews.CountAsync(x => x.ApplicationId == appId && !x.IsDraft);

    if (finalizedReviewsCount >= 4)
    {
        a.Status = "JURY_APPROVED";
        a.JuryId = uid.Value;
        a.JuryActionAt = DateTime.UtcNow;
    }
    else
    {
        a.Status = "UNDER_JURY_REVIEW";
    }

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "JURY_APPROVE", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));

    return Results.Ok(new { message = "Approval and scores recorded successfully", approvalsCount = finalizedReviewsCount });
});

api.MapPost("/jury/reject/{appId}", () =>
{
    return Results.BadRequest(new { message = "Jury rejection is not allowed" });
});

// ========== PANEL CHAIR ==========
api.MapGet("/panel-chair/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "PANEL_CHAIR" && user?.Role != "ADMIN") return Results.Forbid();

    var apps = await db.Applications.Include(a => a.User)
        .Where(a => a.Status == "JURY_APPROVED")
        .Select(a => new {
            a.Id, a.Status, a.SubmittedAt,
            user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email,
            jury_approval_count = db.JuryReviews.Count(jr => jr.ApplicationId == a.Id),
            average_score = db.JuryReviews.Where(jr => jr.ApplicationId == a.Id).Average(jr => (double?)jr.WeightedScore) ?? 0.0,
            applicant_name = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id).Select(ad => ad.FirstName + " " + ad.LastName).FirstOrDefault(),
            category = db.ApplicantDetails.Where(ad => ad.ApplicationId == a.Id).Select(ad => ad.Discipline).FirstOrDefault()
        }).ToListAsync();
    return Results.Ok(apps);
});

api.MapPost("/panel-chair/approve/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "PANEL_CHAIR" && user?.Role != "ADMIN") return Results.Forbid();
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    a.Status = "PANEL_APPROVED"; a.PanelChairId = uid.Value; a.PanelChairActionAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid, "PANEL_APPROVE", "Application", appId, null, GetIp(ctx));
    return Results.Ok(new { message = "Application approved by Panel Chair" });
});

api.MapPost("/panel-chair/reject/{appId}", async (int appId, HttpContext ctx, InnovationDbContext db, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "PANEL_CHAIR" && user?.Role != "ADMIN") return Results.Forbid();
    var body = await ctx.Request.ReadFromJsonAsync<Dictionary<string, string>>();
    var reason = body?.GetValueOrDefault("reason") ?? "";
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    a.Status = "PANEL_REJECTED"; a.PanelChairId = uid.Value; a.PanelChairActionAt = DateTime.UtcNow;
    a.RejectionReason = reason;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid, "PANEL_REJECT", "Application", appId, reason, GetIp(ctx));
    return Results.Ok(new { message = "Application rejected by Panel Chair" });
});

// ========== OPPI SCIENTIST AWARD ==========
var sci = app.MapGroup("/scientist").RequireAuthorization().RequireRateLimiting("api");

// Save Section 1 – Applicant Details
sci.MapPost("/applicant-detail/{appId}", async (int appId, ApplicantDetailDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.FindAsync(appId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.NotFound();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Application has already been submitted and cannot be edited." });

    var e = await db.ApplicantDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (e == null)
    {
        e = new ApplicantDetail { ApplicationId = appId };
        db.ApplicantDetails.Add(e);
    }
    e.Title = dto.Title; e.FirstName = dto.First_Name; e.MiddleName = dto.Middle_Name;
    e.LastName = dto.Last_Name; e.Dob = dto.Dob; e.Gender = dto.Gender;
    e.Email = dto.Email; e.Telephone = dto.Telephone; e.Mobile = dto.Mobile;
    e.Discipline = dto.Discipline; e.InstituteCategory = dto.Institute_Category;
    e.InstituteName = dto.Institute_Name; e.UpdatedAt = DateTime.UtcNow;
    try
    {
        await db.SaveChangesAsync();
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Error saving applicant details for appId {AppId}", appId);
        return Results.BadRequest(new { message = $"Failed to save applicant detail: {ex.InnerException?.Message ?? ex.Message}" });
    }
    await audit.LogAsync(uid, "SAVE_APPLICANT_DETAIL", "Application", appId, null, GetIp(ctx));
    return Results.Ok(new { message = "Section 1 saved" });
});

// Upload Photo – Section 1
sci.MapPost("/upload-photo/{appId}", async (int appId, HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.FindAsync(appId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.NotFound();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Application has already been submitted and cannot be edited." });

    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    if (file == null) return Results.BadRequest(new { message = "No file uploaded" });

    var ext = Path.GetExtension(file.FileName).ToLower();
    if (!new[] { ".jpg", ".jpeg", ".png" }.Contains(ext))
        return Results.BadRequest(new { message = "Only jpg/jpeg/png allowed" });
    if (file.Length > 200 * 1024)
        return Results.BadRequest(new { message = "Photo must be less than 200KB" });

    var uniqueName = $"photo_{Guid.NewGuid()}{ext}";
    var url = await storage.UploadFileAsync(file, appId.ToString(), uniqueName);

    var detail = await db.ApplicantDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (detail == null) { detail = new ApplicantDetail { ApplicationId = appId }; db.ApplicantDetails.Add(detail); }
    detail.PhotoPath = url; detail.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Photo uploaded", photo_url = url });
});

// Save Section 2 – Application Details
sci.MapPost("/application-detail/{appId}", async (int appId, ApplicationDetailDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit, IStorageService storage) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.FindAsync(appId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.NotFound();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Application has already been submitted and cannot be edited." });

    var e = await db.ApplicationDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (e == null) { e = new ApplicationDetail { ApplicationId = appId }; db.ApplicationDetails.Add(e); }
    e.Category = dto.Category; e.BriefStatement = dto.Brief_Statement;
    e.SignificantContribution = dto.Significant_Contribution;
    e.ImpactContribution = dto.Impact_Contribution;
    e.HasPatent = dto.Has_Patent;
    e.HasPublication = dto.Has_Publication;
    if (dto.Has_Publication == false)
    {
        var pubsToDelete = await db.Patents.Where(p => p.ApplicationDetailId == e.Id && (p.Type == "PUBLICATION" || string.IsNullOrEmpty(p.Type))).ToListAsync();
        foreach (var pub in pubsToDelete)
        {
            if (!string.IsNullOrWhiteSpace(pub.AttachmentPath))
            {
                await storage.DeleteFileAsync(pub.AttachmentPath);
            }
        }
        if (pubsToDelete.Any()) db.Patents.RemoveRange(pubsToDelete);
    }
    if (dto.Has_Patent == false)
    {
        var patsToDelete = await db.Patents.Where(p => p.ApplicationDetailId == e.Id && p.Type == "PATENT").ToListAsync();
        foreach (var pat in patsToDelete)
        {
            if (!string.IsNullOrWhiteSpace(pat.AttachmentPath))
            {
                await storage.DeleteFileAsync(pat.AttachmentPath);
            }
        }
        if (patsToDelete.Any()) db.Patents.RemoveRange(patsToDelete);
    }
    e.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid, "SAVE_APP_DETAIL", "Application", appId, null, GetIp(ctx));
    return Results.Ok(new { message = "Section 2 saved", application_detail_id = e.Id });
});

// Upsert Patents list
sci.MapPost("/patents/{appId}", async (int appId, PatentListDto dto, InnovationDbContext db, HttpContext ctx, IStorageService storage) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.FindAsync(appId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.NotFound();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Application has already been submitted and cannot be edited." });

    var detail = await db.ApplicationDetails.Include(x => x.Patents).FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (detail == null) return Results.BadRequest(new { message = "Save Section 2 first" });

    if (dto.Patents.Count(x => x.Type == "PUBLICATION") > 5) return Results.BadRequest(new { message = "Maximum 5 publications allowed" });
    if (dto.Patents.Count(x => x.Type == "PATENT") > 5) return Results.BadRequest(new { message = "Maximum 5 patents allowed" });

    // Separate incoming items by type
    var incomingPubs = dto.Patents.Where(x => (x.Type ?? "").ToUpper() == "PUBLICATION" || string.IsNullOrEmpty(x.Type)).ToList();
    var incomingPats = dto.Patents.Where(x => (x.Type ?? "").ToUpper() == "PATENT").ToList();

    var existingPubs = detail.Patents.Where(p => (p.Type ?? "").ToUpper() == "PUBLICATION" || string.IsNullOrEmpty(p.Type)).OrderBy(p => p.SortOrder).ToList();
    var existingPats = detail.Patents.Where(p => (p.Type ?? "").ToUpper() == "PATENT").OrderBy(p => p.SortOrder).ToList();

    // 1. Process Publications
    if (incomingPubs.Any())
    {
        for (int i = existingPubs.Count - 1; i >= incomingPubs.Count; i--)
        {
            var del = existingPubs[i];
            if (!string.IsNullOrWhiteSpace(del.AttachmentPath))
            {
                await storage.DeleteFileAsync(del.AttachmentPath);
            }
            db.Patents.Remove(del);
        }

        for (int i = 0; i < incomingPubs.Count; i++)
        {
            var pd = incomingPubs[i];
            Patent existing = null;
            if (pd.Id > 0) existing = existingPubs.FirstOrDefault(p => p.Id == pd.Id);
            if (existing == null && i < existingPubs.Count) existing = existingPubs[i];

            if (existing != null)
            {
                existing.Title = pd.Title;
                existing.Type = "PUBLICATION";
                existing.HasAttachment = pd.Has_Attachment;
                existing.IsPrimaryWriter = pd.Is_Primary_Writer;
                existing.SortOrder = i;

                if (pd.Has_Attachment == false)
                {
                    if (!string.IsNullOrWhiteSpace(existing.AttachmentPath))
                    {
                        await storage.DeleteFileAsync(existing.AttachmentPath);
                    }
                    existing.AttachmentPath = null;
                    existing.AttachmentFileName = null;
                }
                else
                {
                    if (!string.IsNullOrWhiteSpace(pd.Attachment_Path))
                    {
                        existing.AttachmentPath = pd.Attachment_Path;
                    }
                    if (!string.IsNullOrWhiteSpace(pd.Attachment_File_Name))
                    {
                        existing.AttachmentFileName = pd.Attachment_File_Name;
                    }
                }
            }
            else
            {
                detail.Patents.Add(new Patent
                {
                    Title = pd.Title,
                    Type = "PUBLICATION",
                    HasAttachment = pd.Has_Attachment,
                    IsPrimaryWriter = pd.Is_Primary_Writer,
                    SortOrder = i,
                    AttachmentPath = (pd.Has_Attachment == true && !string.IsNullOrWhiteSpace(pd.Attachment_Path)) ? pd.Attachment_Path : null,
                    AttachmentFileName = (pd.Has_Attachment == true && !string.IsNullOrWhiteSpace(pd.Attachment_File_Name)) ? pd.Attachment_File_Name : null,
                    ApplicationDetailId = detail.Id
                });
            }
        }
    }

    // 2. Process Patents
    if (incomingPats.Any())
    {
        for (int i = existingPats.Count - 1; i >= incomingPats.Count; i--)
        {
            var del = existingPats[i];
            if (!string.IsNullOrWhiteSpace(del.AttachmentPath))
            {
                await storage.DeleteFileAsync(del.AttachmentPath);
            }
            db.Patents.Remove(del);
        }

        for (int i = 0; i < incomingPats.Count; i++)
        {
            var pd = incomingPats[i];
            Patent existing = null;
            if (pd.Id > 0) existing = existingPats.FirstOrDefault(p => p.Id == pd.Id);
            if (existing == null && i < existingPats.Count) existing = existingPats[i];

            if (existing != null)
            {
                existing.Title = pd.Title;
                existing.Type = "PATENT";
                existing.HasAttachment = pd.Has_Attachment;
                existing.IsPrimaryWriter = pd.Is_Primary_Writer;
                existing.SortOrder = i;

                if (pd.Has_Attachment == false)
                {
                    if (!string.IsNullOrWhiteSpace(existing.AttachmentPath))
                    {
                        await storage.DeleteFileAsync(existing.AttachmentPath);
                    }
                    existing.AttachmentPath = null;
                    existing.AttachmentFileName = null;
                }
                else
                {
                    if (!string.IsNullOrWhiteSpace(pd.Attachment_Path))
                    {
                        existing.AttachmentPath = pd.Attachment_Path;
                    }
                    if (!string.IsNullOrWhiteSpace(pd.Attachment_File_Name))
                    {
                        existing.AttachmentFileName = pd.Attachment_File_Name;
                    }
                }
            }
            else
            {
                detail.Patents.Add(new Patent
                {
                    Title = pd.Title,
                    Type = "PATENT",
                    HasAttachment = pd.Has_Attachment,
                    IsPrimaryWriter = pd.Is_Primary_Writer,
                    SortOrder = i,
                    AttachmentPath = (pd.Has_Attachment == true && !string.IsNullOrWhiteSpace(pd.Attachment_Path)) ? pd.Attachment_Path : null,
                    AttachmentFileName = (pd.Has_Attachment == true && !string.IsNullOrWhiteSpace(pd.Attachment_File_Name)) ? pd.Attachment_File_Name : null,
                    ApplicationDetailId = detail.Id
                });
            }
        }
    }

    await db.SaveChangesAsync();
    var savedPatents = detail.Patents.OrderBy(p => p.Type).ThenBy(p => p.SortOrder).Select(p => new {
        p.Id, p.Title, p.Type, p.HasAttachment, p.IsPrimaryWriter, p.SortOrder,
        p.AttachmentPath, p.AttachmentFileName
    }).ToList();
    return Results.Ok(new { message = "Patents saved", patents = savedPatents });
});

// Upload Patent attachment
sci.MapPost("/upload-patent-attachment/{patentId}", async (int patentId, HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var patent = await db.Patents.Include(p => p.ApplicationDetail).FirstOrDefaultAsync(p => p.Id == patentId);
    if (patent == null) return Results.NotFound();

    var app2 = await db.Applications.FindAsync(patent.ApplicationDetail.ApplicationId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.Forbid();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Application has already been submitted and cannot be edited." });

    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    if (file == null) return Results.BadRequest(new { message = "No file uploaded" });

    if (file.Length > 3 * 1024 * 1024) return Results.BadRequest(new { message = "File exceeds 3MB" });
    var ext = Path.GetExtension(file.FileName).ToLower();
    var allowedExts = new[] { ".pdf", ".png", ".jpg", ".jpeg" };
    if (!allowedExts.Contains(ext))
        return Results.BadRequest(new { message = "Only PDF, PNG, or JPG files allowed" });

    var uniqueName = $"patent_{Guid.NewGuid()}{ext}";
    var url = await storage.UploadFileAsync(file, patent.ApplicationDetail.ApplicationId.ToString(), uniqueName);
    patent.AttachmentPath = url; patent.AttachmentFileName = file.FileName; patent.HasAttachment = true;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Attachment uploaded", url, path = url });
});

// Upload CV or Auth Certificate
sci.MapPost("/upload-document/{appId}/{docType}", async (int appId, string docType, HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.FindAsync(appId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.NotFound();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Application has already been submitted and cannot be edited." });

    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    if (file == null) return Results.BadRequest(new { message = "No file uploaded" });

    if (file.Length > 3 * 1024 * 1024) return Results.BadRequest(new { message = "File exceeds 3MB" });
    var ext = Path.GetExtension(file.FileName).ToLower();

    string[] allowedExts = docType == "cv" ? new[] { ".pdf" } : new[] { ".jpg", ".jpeg", ".pdf" };
    if (!allowedExts.Contains(ext))
        return Results.BadRequest(new { message = $"{docType} must be {string.Join("/", allowedExts)}" });

    var uniqueName = $"{docType}_{Guid.NewGuid()}{ext}";
    var url = await storage.UploadFileAsync(file, appId.ToString(), uniqueName);

    var detail = await db.ApplicationDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (detail == null) { detail = new ApplicationDetail { ApplicationId = appId }; db.ApplicationDetails.Add(detail); }

    if (docType == "cv") { detail.CvFilePath = url; detail.CvFileName = file.FileName; }
    else { detail.AuthCertFilePath = url; detail.AuthCertFileName = file.FileName; }
    detail.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = $"{docType} uploaded", url, path = url, file_name = file.FileName });
});

// Get full scientist application for preview
sci.MapGet("/application/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.FindAsync(appId);
    if (app2 == null) return Results.NotFound();

    var user = await db.Users.FindAsync(uid.Value);
    var isEvaluator = user != null && (user.Role == "ADMIN" || user.Role == "VALIDATOR" || user.Role == "JURY" || user.Role == "PANEL_CHAIR");
    if (app2.UserId != uid.Value && !isEvaluator) return Results.Forbid();

    var applicant = await db.ApplicantDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    var appDetail = await db.ApplicationDetails.Include(x => x.Patents).FirstOrDefaultAsync(x => x.ApplicationId == appId);

    return Results.Ok(new
    {
        id = app2.Id, status = app2.Status,
        applicant_detail = applicant == null ? null : new {
            applicant.PhotoPath, applicant.Title, applicant.FirstName, applicant.MiddleName, applicant.LastName,
            applicant.Dob, applicant.Gender, applicant.Email, applicant.Telephone, applicant.Mobile,
            applicant.Discipline, applicant.InstituteCategory, applicant.InstituteName
        },
        application_detail = appDetail == null ? null : new {
            appDetail.Id, appDetail.Category, appDetail.BriefStatement, appDetail.SignificantContribution,
            appDetail.ImpactContribution, appDetail.HasPatent, appDetail.HasPublication, appDetail.CvFilePath, appDetail.CvFileName,
            appDetail.AuthCertFilePath, appDetail.AuthCertFileName,
            patents = appDetail.Patents.OrderBy(p => p.SortOrder).Select(p => {
                var path = p.AttachmentPath;
                if (string.IsNullOrWhiteSpace(path) && (p.HasAttachment == true || !string.IsNullOrWhiteSpace(p.AttachmentFileName)))
                {
                    var appFolder = Path.Combine(uploadsDir, appId.ToString());
                    if (Directory.Exists(appFolder))
                    {
                        var files = Directory.GetFiles(appFolder)
                            .Where(f => {
                                var fn = Path.GetFileName(f).ToLower();
                                return !fn.StartsWith("cv_") && !fn.StartsWith("auth_");
                            }).ToList();
                        if (files.Any())
                        {
                            var matched = string.IsNullOrWhiteSpace(p.AttachmentFileName)
                                ? null
                                : files.FirstOrDefault(f => Path.GetFileName(f).Equals(p.AttachmentFileName, StringComparison.OrdinalIgnoreCase));
                            if (matched != null)
                            {
                                path = $"/uploads/{appId}/{Path.GetFileName(matched)}";
                            }
                        }
                    }
                }
                return new {
                    p.Id, p.Title, p.Type, p.HasAttachment, AttachmentPath = path, p.AttachmentFileName, p.IsPrimaryWriter, p.SortOrder
                };
            })
        }
    });
});

// Submit scientist application
sci.MapPost("/submit/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit, EmailService emailService) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var app2 = await db.Applications.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == appId);
    var user = await db.Users.FindAsync(uid.Value);
    var isAdmin = user?.Role == "ADMIN";
    if (app2 == null || (app2.UserId != uid.Value && !isAdmin)) return Results.NotFound();
    if (app2.Status != "DRAFT" && !isAdmin) return Results.BadRequest(new { message = "Already submitted" });

    var applicant = await db.ApplicantDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    var appDetail = await db.ApplicationDetails.Include(x => x.Patents).FirstOrDefaultAsync(x => x.ApplicationId == appId);

    // Validate mandatory fields
    var errors = new List<string>();
    if (applicant == null) errors.Add("Section 1 not saved");
    else {
        if (string.IsNullOrWhiteSpace(applicant.Title)) errors.Add("Title is required");
        if (string.IsNullOrWhiteSpace(applicant.FirstName)) errors.Add("First Name is required");
        if (string.IsNullOrWhiteSpace(applicant.LastName)) errors.Add("Last Name is required");
        if (string.IsNullOrWhiteSpace(applicant.Dob)) errors.Add("Date of Birth is required");
        if (string.IsNullOrWhiteSpace(applicant.Gender)) errors.Add("Gender is required");
        if (string.IsNullOrWhiteSpace(applicant.Email)) errors.Add("Email is required");
        if (string.IsNullOrWhiteSpace(applicant.Mobile)) errors.Add("Mobile is required");
        if (string.IsNullOrWhiteSpace(applicant.Discipline)) errors.Add("Discipline is required");
        if (string.IsNullOrWhiteSpace(applicant.InstituteCategory)) errors.Add("Institute Category is required");
        if (string.IsNullOrWhiteSpace(applicant.InstituteName)) errors.Add("Institute Name is required");
        if (string.IsNullOrWhiteSpace(applicant.PhotoPath)) errors.Add("Photo is required");
    }
    if (appDetail == null) errors.Add("Section 2 not saved");
    else {
        if (string.IsNullOrWhiteSpace(appDetail.Category)) errors.Add("Category is required");
        if (string.IsNullOrWhiteSpace(appDetail.BriefStatement)) errors.Add("Brief Statement is required");
        if (string.IsNullOrWhiteSpace(appDetail.SignificantContribution)) errors.Add("Significant Contribution is required");
        if (string.IsNullOrWhiteSpace(appDetail.ImpactContribution)) errors.Add("Impact Contribution is required");
        if (appDetail.HasPublication == null) errors.Add("Publication answer is required");
        if (appDetail.HasPublication == true && !appDetail.Patents.Any(x => x.Type == "PUBLICATION" || string.IsNullOrEmpty(x.Type))) errors.Add("At least one publication entry is required");
        if (appDetail.HasPatent == null) errors.Add("Patent answer is required");
        if (appDetail.HasPatent == true && !appDetail.Patents.Any(x => x.Type == "PATENT")) errors.Add("At least one patent entry is required");
        if (string.IsNullOrWhiteSpace(appDetail.CvFilePath)) errors.Add("CV is required");
        if (string.IsNullOrWhiteSpace(appDetail.AuthCertFilePath)) errors.Add("Authentication Certificate is required");
    }
    if (errors.Any()) return Results.BadRequest(new { message = "Validation failed", errors });

    if (app2.Status == "DRAFT") app2.Status = "SUBMITTED";
    if (app2.SubmittedAt == null) app2.SubmittedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid, "SUBMIT_SCIENTIST_APP", "Application", appId, null, GetIp(ctx));

    try
    {
        var displayName = $"{app2.User.FirstName} {app2.User.LastName}".Trim();
        await emailService.SendApplicationSubmissionEmailAsync(app2.User.Email, displayName, app2.Id);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to send scientist application submission email for application {AppId}", appId);
    }

    return Results.Ok(new { message = "Application submitted successfully" });
});

app.Run();
} catch (Exception ex) { Log.Fatal(ex, "Fatal"); }
finally { Log.CloseAndFlush(); }
