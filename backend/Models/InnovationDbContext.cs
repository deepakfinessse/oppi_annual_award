using Microsoft.EntityFrameworkCore;

namespace OppiInnovationApi.Models;

public class InnovationDbContext : DbContext
{
    public InnovationDbContext(DbContextOptions<InnovationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<AllowedDomain> AllowedDomains => Set<AllowedDomain>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<PersonalInfo> PersonalInfos => Set<PersonalInfo>();
    public DbSet<CompanyReach> CompanyReaches => Set<CompanyReach>();
    public DbSet<CompanyDetail> CompanyDetails => Set<CompanyDetail>();
    public DbSet<FileUpload> FileUploads => Set<FileUpload>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<JuryReview> JuryReviews => Set<JuryReview>();
    public DbSet<ValidatorReview> ValidatorReviews => Set<ValidatorReview>();
    // OPPI Scientist Award
    public DbSet<ApplicantDetail> ApplicantDetails => Set<ApplicantDetail>();
    public DbSet<ApplicationDetail> ApplicationDetails => Set<ApplicationDetail>();
    public DbSet<Patent> Patents => Set<Patent>();
    public DbSet<PanelMember> PanelMembers => Set<PanelMember>();
    public DbSet<PastWinner> PastWinners => Set<PastWinner>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.UseCollation("utf8mb4_unicode_ci").HasCharSet("utf8mb4");

        mb.Entity<User>(e => {
            e.ToTable("users");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(50);
            e.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(100);
            e.Property(x => x.MiddleName).HasColumnName("middle_name").HasMaxLength(100);
            e.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(100);
            e.Property(x => x.Dob).HasColumnName("dob").HasMaxLength(50);
            e.Property(x => x.Gender).HasColumnName("gender").HasMaxLength(50);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
            e.Property(x => x.Mobile).HasColumnName("mobile").HasMaxLength(15);
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasColumnType("text");
            e.Property(x => x.Role).HasColumnName("role").HasColumnType("enum('USER','VALIDATOR','JURY','PANEL_CHAIR','ADMIN')").HasDefaultValue("USER");
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.ResetPasswordToken).HasColumnName("reset_password_token").HasMaxLength(255);
            e.Property(x => x.ResetPasswordExpiry).HasColumnName("reset_password_expiry");
            e.HasQueryFilter(u => !u.IsDeleted);
        });

        mb.Entity<AllowedDomain>(e => {
            e.ToTable("allowed_domains");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Domain).HasColumnName("domain").HasMaxLength(255);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        mb.Entity<Application>(e => {
            e.ToTable("applications");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).HasDefaultValue("DRAFT");
            e.Property(x => x.ValidatorId).HasColumnName("validator_id");
            e.Property(x => x.JuryId).HasColumnName("jury_id");
            e.Property(x => x.PanelChairId).HasColumnName("panel_chair_id");
            e.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            e.Property(x => x.ValidatorActionAt).HasColumnName("validator_action_at");
            e.Property(x => x.JuryActionAt).HasColumnName("jury_action_at");
            e.Property(x => x.PanelChairActionAt).HasColumnName("panel_chair_action_at");
            e.Property(x => x.RejectionReason).HasColumnName("rejection_reason").HasColumnType("text");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasOne(x => x.User).WithMany(u => u.Applications).HasForeignKey(x => x.UserId);
        });

        mb.Entity<PersonalInfo>(e => {
            e.ToTable("personal_info");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.CompanyName).HasColumnName("company_name");
            e.Property(x => x.Designation).HasColumnName("designation");
            e.Property(x => x.CategoryOfWork).HasColumnName("category_of_work");
            e.Property(x => x.OtherCategory).HasColumnName("other_category");
            e.Property(x => x.CompanyWebsite).HasColumnName("company_website");
            e.Property(x => x.CompanyBrief).HasColumnName("company_brief").HasColumnType("text");
            e.Property(x => x.Innovation).HasColumnName("innovation").HasColumnType("text");
            e.Property(x => x.CompetitiveAnalysis).HasColumnName("competitive_analysis").HasColumnType("text");
            e.Property(x => x.NeedAnalysis).HasColumnName("need_analysis").HasColumnType("text");
            e.Property(x => x.Marketability).HasColumnName("marketability").HasColumnType("text");
            e.HasOne(x => x.Application).WithOne(a => a.PersonalInfo).HasForeignKey<PersonalInfo>(x => x.ApplicationId);
        });

        mb.Entity<CompanyReach>(e => {
            e.ToTable("company_reach");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.MarketingStrategy).HasColumnName("marketing_strategy").HasColumnType("text");
            e.Property(x => x.AppDetails).HasColumnName("app_details").HasColumnType("text");
            e.Property(x => x.WebsiteDetails).HasColumnName("website_details").HasColumnType("text");
            e.Property(x => x.SocialMedia).HasColumnName("social_media").HasColumnType("text");
            e.Property(x => x.PhysicalOutlets).HasColumnName("physical_outlets").HasColumnType("text");
            e.Property(x => x.FutureExpansion).HasColumnName("future_expansion").HasColumnType("text");
            e.HasOne(x => x.Application).WithOne(a => a.CompanyReach).HasForeignKey<CompanyReach>(x => x.ApplicationId);
        });

        mb.Entity<CompanyDetail>(e => {
            e.ToTable("company_details");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.CustomerBenefit).HasColumnName("customer_benefit").HasColumnType("text");
            e.Property(x => x.Testimonial).HasColumnName("testimonial").HasColumnType("text");
            e.Property(x => x.EmployeeCount).HasColumnName("employee_count");
            e.Property(x => x.BoardOfDirectors).HasColumnName("board_of_directors").HasColumnType("text");
            e.Property(x => x.InvestorsDetails).HasColumnName("investors_details").HasColumnType("text");
            e.Property(x => x.MediaMentions).HasColumnName("media_mentions").HasColumnType("text");
            e.Property(x => x.Patents).HasColumnName("patents").HasColumnType("text");
            e.Property(x => x.ProductBenefits).HasColumnName("product_benefits").HasColumnType("text");
            e.HasOne(x => x.Application).WithOne(a => a.CompanyDetail).HasForeignKey<CompanyDetail>(x => x.ApplicationId);
        });

        mb.Entity<FileUpload>(e => {
            e.ToTable("file_uploads");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.Section).HasColumnName("section");
            e.Property(x => x.FileName).HasColumnName("file_name");
            e.Property(x => x.FilePath).HasColumnName("file_path");
            e.Property(x => x.FileSize).HasColumnName("file_size");
            e.Property(x => x.FileType).HasColumnName("file_type");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasOne(x => x.Application).WithMany(a => a.FileUploads).HasForeignKey(x => x.ApplicationId);
        });

        mb.Entity<RefreshToken>(e => {
            e.ToTable("refresh_tokens");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Token).HasColumnName("token").HasMaxLength(500);
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.RevokedAt).HasColumnName("revoked_at");
            e.Property(x => x.DeviceInfo).HasColumnName("device_info");
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId);
            e.Ignore(x => x.IsActive);
        });

        mb.Entity<AuditLog>(e => {
            e.ToTable("audit_logs");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Action).HasColumnName("action").HasMaxLength(100);
            e.Property(x => x.EntityType).HasColumnName("entity_type");
            e.Property(x => x.EntityId).HasColumnName("entity_id");
            e.Property(x => x.Details).HasColumnName("details").HasColumnType("text");
            e.Property(x => x.IpAddress).HasColumnName("ip_address");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        mb.Entity<JuryReview>(e => {
            e.ToTable("jury_reviews");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.JuryId).HasColumnName("jury_id");
            e.Property(x => x.InnovationIpScore).HasColumnName("innovation_ip_score");
            e.Property(x => x.TeamStrengthScore).HasColumnName("team_strength_score");
            e.Property(x => x.BusinessPlanScore).HasColumnName("business_plan_score");
            e.Property(x => x.ImpactScore).HasColumnName("impact_score");
            e.Property(x => x.WeightedScore).HasColumnName("weighted_score");
            e.Property(x => x.Comments).HasColumnName("comments").HasColumnType("text");
            e.Property(x => x.IsDraft).HasColumnName("is_draft").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");

            e.HasOne(x => x.Application).WithMany().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Jury).WithMany().HasForeignKey(x => x.JuryId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.ApplicationId, x.JuryId }).IsUnique();
        });

        mb.Entity<ValidatorReview>(e => {
            e.ToTable("validator_reviews");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.ValidatorId).HasColumnName("validator_id");
            e.Property(x => x.InnovationIpScore).HasColumnName("innovation_ip_score");
            e.Property(x => x.TeamStrengthScore).HasColumnName("team_strength_score");
            e.Property(x => x.BusinessPlanScore).HasColumnName("business_plan_score");
            e.Property(x => x.ImpactScore).HasColumnName("impact_score");
            e.Property(x => x.WeightedScore).HasColumnName("weighted_score");
            e.Property(x => x.Comments).HasColumnName("comments").HasColumnType("text");
            e.Property(x => x.IsDraft).HasColumnName("is_draft").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");

            e.HasOne(x => x.Application).WithMany().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Validator).WithMany().HasForeignKey(x => x.ValidatorId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.ApplicationId, x.ValidatorId }).IsUnique();
        });

        mb.Entity<ApplicantDetail>(e => {
            e.ToTable("applicant_details");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.PhotoPath).HasColumnName("photo_path");
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(10);
            e.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(100);
            e.Property(x => x.MiddleName).HasColumnName("middle_name").HasMaxLength(100);
            e.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(100);
            e.Property(x => x.Dob).HasColumnName("dob").HasMaxLength(20);
            e.Property(x => x.Gender).HasColumnName("gender").HasMaxLength(20);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
            e.Property(x => x.Telephone).HasColumnName("telephone").HasMaxLength(20);
            e.Property(x => x.Mobile).HasColumnName("mobile").HasMaxLength(20);
            e.Property(x => x.Discipline).HasColumnName("discipline").HasMaxLength(255);
            e.Property(x => x.InstituteCategory).HasColumnName("institute_category").HasMaxLength(100);
            e.Property(x => x.InstituteName).HasColumnName("institute_name").HasMaxLength(255);
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Application).WithOne().HasForeignKey<ApplicantDetail>(x => x.ApplicationId);
        });

        mb.Entity<ApplicationDetail>(e => {
            e.ToTable("application_details");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.Category).HasColumnName("category").HasMaxLength(50);
            e.Property(x => x.BriefStatement).HasColumnName("brief_statement").HasColumnType("text");
            e.Property(x => x.SignificantContribution).HasColumnName("significant_contribution").HasColumnType("text");
            e.Property(x => x.ImpactContribution).HasColumnName("impact_contribution").HasColumnType("text");
            e.Property(x => x.HasPatent).HasColumnName("has_patent");
            e.Property(x => x.HasPublication).HasColumnName("has_publication");
            e.Property(x => x.CvFilePath).HasColumnName("cv_file_path");
            e.Property(x => x.CvFileName).HasColumnName("cv_file_name");
            e.Property(x => x.AuthCertFilePath).HasColumnName("auth_cert_file_path");
            e.Property(x => x.AuthCertFileName).HasColumnName("auth_cert_file_name");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Application).WithOne().HasForeignKey<ApplicationDetail>(x => x.ApplicationId);
            e.HasMany(x => x.Patents).WithOne(p => p.ApplicationDetail).HasForeignKey(p => p.ApplicationDetailId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<Patent>(e => {
            e.ToTable("patents");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationDetailId).HasColumnName("application_detail_id");
            e.Property(x => x.Title).HasColumnName("title").HasColumnType("text");
            e.Property(x => x.Type).HasColumnName("type").HasMaxLength(50);
            e.Property(x => x.HasAttachment).HasColumnName("has_attachment");
            e.Property(x => x.AttachmentPath).HasColumnName("attachment_path");
            e.Property(x => x.AttachmentFileName).HasColumnName("attachment_file_name");
            e.Property(x => x.IsPrimaryWriter).HasColumnName("is_primary_writer");
            e.Property(x => x.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
        });

        mb.Entity<PanelMember>(e => {
            e.ToTable("panel_members");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150);
            e.Property(x => x.Role).HasColumnName("role").HasColumnType("text");
            e.Property(x => x.Type).HasColumnName("type").HasMaxLength(30); // VALIDATOR, JURY, PANEL_CHAIR
            e.Property(x => x.ImagePath).HasColumnName("image_path");
            e.Property(x => x.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(150);
            e.Property(x => x.Password).HasColumnName("password").HasMaxLength(150);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        mb.Entity<PastWinner>(e => {
            e.ToTable("past_winners");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Year).HasColumnName("year");
            e.Property(x => x.Category).HasColumnName("category").HasMaxLength(100);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150);
            e.Property(x => x.Description).HasColumnName("description").HasColumnType("text");
            e.Property(x => x.ImagePath).HasColumnName("image_path");
            e.Property(x => x.Color).HasColumnName("color").HasMaxLength(50);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });
    }
}
