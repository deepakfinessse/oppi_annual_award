using System.Text.Json.Serialization;

namespace OppiInnovationApi.Models;
public class User
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string FirstName { get; set; } = null!;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = null!;
    public string? Dob { get; set; }
    public string? Gender { get; set; }
    public string Email { get; set; } = null!;
    public string? Mobile { get; set; }
    [JsonIgnore]
    public string PasswordHash { get; set; } = null!;
    public string Role { get; set; } = "USER";
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    [JsonIgnore]
    public string? ResetPasswordToken { get; set; }
    [JsonIgnore]
    public DateTime? ResetPasswordExpiry { get; set; }
    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
    [JsonIgnore]
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class AllowedDomain
{
    public int Id { get; set; }
    public string Domain { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}

public class Application
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public int? ValidatorId { get; set; }
    public int? JuryId { get; set; }
    public int? PanelChairId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ValidatorActionAt { get; set; }
    public DateTime? JuryActionAt { get; set; }
    public DateTime? PanelChairActionAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual User User { get; set; } = null!;
    public virtual PersonalInfo? PersonalInfo { get; set; }
    public virtual CompanyReach? CompanyReach { get; set; }
    public virtual CompanyDetail? CompanyDetail { get; set; }
    public virtual ICollection<FileUpload> FileUploads { get; set; } = new List<FileUpload>();
}

public class PersonalInfo
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string? CompanyName { get; set; }
    public string? Designation { get; set; }
    public string? CategoryOfWork { get; set; }
    public string? OtherCategory { get; set; }
    public string? CompanyWebsite { get; set; }
    public string? CompanyBrief { get; set; }
    public string? Innovation { get; set; }
    public string? CompetitiveAnalysis { get; set; }
    public string? NeedAnalysis { get; set; }
    public string? Marketability { get; set; }
    public virtual Application Application { get; set; } = null!;
}

public class CompanyReach
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string? MarketingStrategy { get; set; }
    public string? AppDetails { get; set; }
    public string? WebsiteDetails { get; set; }
    public string? SocialMedia { get; set; }
    public string? PhysicalOutlets { get; set; }
    public string? FutureExpansion { get; set; }
    public virtual Application Application { get; set; } = null!;
}

public class CompanyDetail
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string? CustomerBenefit { get; set; }
    public string? Testimonial { get; set; }
    public string? EmployeeCount { get; set; }
    public string? BoardOfDirectors { get; set; }
    public string? InvestorsDetails { get; set; }
    public string? MediaMentions { get; set; }
    public string? Patents { get; set; }
    public string? ProductBenefits { get; set; }
    public virtual Application Application { get; set; } = null!;
}

public class FileUpload
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string Section { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public int? FileSize { get; set; }
    public string? FileType { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual Application Application { get; set; } = null!;
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? DeviceInfo { get; set; }
    public bool IsActive => RevokedAt == null && DateTime.UtcNow < ExpiresAt;
    public virtual User User { get; set; } = null!;
}

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = null!;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class JuryReview
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int JuryId { get; set; }
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public double WeightedScore { get; set; }
    public string? Comments { get; set; }
    public bool IsDraft { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual Application Application { get; set; } = null!;
    public virtual User Jury { get; set; } = null!;
}

public class ValidatorReview
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int ValidatorId { get; set; }
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public double WeightedScore { get; set; }
    public string? Comments { get; set; }
    public bool IsDraft { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual Application Application { get; set; } = null!;
    public virtual User Validator { get; set; } = null!;
}

// ===== OPPI SCIENTIST AWARD MODELS =====

public class ApplicantDetail
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    // Photo
    public string? PhotoPath { get; set; }
    // Personal
    public string? Title { get; set; }          // Mr, Miss, Mrs, Dr
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Dob { get; set; }             // stored as DD-MM-YYYY string
    public string? Gender { get; set; }          // Male, Female, Other
    public string? Email { get; set; }
    public string? Telephone { get; set; }
    public string? Mobile { get; set; }
    // Professional
    public string? Discipline { get; set; }
    public string? InstituteCategory { get; set; }
    public string? InstituteName { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Application Application { get; set; } = null!;
}

public class ApplicationDetail
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string? Category { get; set; }                  // SCIENTIST / YOUNG_SCIENTIST / WOMAN_SCIENTIST
    public string? BriefStatement { get; set; }            // 50 words
    public string? SignificantContribution { get; set; }   // 750 words
    public string? ImpactContribution { get; set; }        // 100 words
    public bool? HasPatent { get; set; }
    public bool? HasPublication { get; set; }
    public string? CvFilePath { get; set; }
    public string? CvFileName { get; set; }
    public string? AuthCertFilePath { get; set; }
    public string? AuthCertFileName { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Application Application { get; set; } = null!;
    public virtual ICollection<Patent> Patents { get; set; } = new List<Patent>();
}

public class Patent
{
    public int Id { get; set; }
    public int ApplicationDetailId { get; set; }
    public string? Title { get; set; }
    public string? Type { get; set; }
    public bool? HasAttachment { get; set; }
    public string? AttachmentPath { get; set; }
    public string? AttachmentFileName { get; set; }
    public bool? IsPrimaryWriter { get; set; }
    public int SortOrder { get; set; }
    public virtual ApplicationDetail ApplicationDetail { get; set; } = null!;
}

public class PanelMember
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Role { get; set; } = null!; // description/affiliation
    public string Type { get; set; } = null!; // VALIDATOR, JURY, PANEL_CHAIR
    public string? ImagePath { get; set; }
    public int SortOrder { get; set; } = 0;
    public string? Email { get; set; }
    [JsonIgnore]
    public string? Password { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PastWinner
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Category { get; set; } = null!; // SCIENTIST OF THE YEAR, WOMAN SCIENTIST OF THE YEAR, etc.
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!; // affiliation
    public string? ImagePath { get; set; }
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
