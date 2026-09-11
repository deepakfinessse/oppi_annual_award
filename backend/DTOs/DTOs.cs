namespace OppiInnovationApi.DTOs;

public class RegisterDto
{
    public string? Title { get; set; }
    public string First_Name { get; set; } = null!;
    public string? Middle_Name { get; set; }
    public string Last_Name { get; set; } = null!;
    public string? Dob { get; set; }
    public string? Gender { get; set; }
    public string? Organisation { get; set; }
    public string Email { get; set; } = null!;
    public string Mobile { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public string? CaptchaAnswer { get; set; }
}

public class LoginDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public string? CaptchaAnswer { get; set; }
}

public class ApplicationSaveDto
{
    public string? AwardCategory { get; set; }
    public string? OrganisationName { get; set; }
    public string? RepresentativeName { get; set; }
    public string? Designation { get; set; }
    public string? Gender { get; set; }
    public string? EmailId { get; set; }
    public string? MobileNumber { get; set; }
    public string? BriefDescription { get; set; }
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public string? CaptchaAnswer { get; set; }
}

public class ChangePasswordDto
{
    public string Old_Password { get; set; } = null!;
    public string New_Password { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public string? CaptchaAnswer { get; set; }
}

public class ResetPasswordDto
{
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public string? CaptchaAnswer { get; set; }
}

public class PersonalInfoDto
{
    public string? Company_Name { get; set; }
    public string? Designation { get; set; }
    public string? Category_Of_Work { get; set; }
    public string? Other_Category { get; set; }
    public string? Company_Website { get; set; }
    public string? Company_Brief { get; set; }
    public string? Innovation { get; set; }
    public string? Competitive_Analysis { get; set; }
    public string? Need_Analysis { get; set; }
    public string? Marketability { get; set; }
}

public class CompanyReachDto
{
    public string? Marketing_Strategy { get; set; }
    public string? App_Details { get; set; }
    public string? Website_Details { get; set; }
    public string? Social_Media { get; set; }
    public string? Physical_Outlets { get; set; }
    public string? Future_Expansion { get; set; }
}

public class CompanyDetailsDto
{
    public string? Customer_Benefit { get; set; }
    public string? Testimonial { get; set; }
    public string? Employee_Count { get; set; }
    public string? Board_Of_Directors { get; set; }
    public string? Investors_Details { get; set; }
    public string? Media_Mentions { get; set; }
    public string? Patents { get; set; }
    public string? Product_Benefits { get; set; }
}

public class JuryApprovalDto
{
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public double? WeightedScore { get; set; }
    public string? Comments { get; set; }
}

public class ValidatorEvaluationDto
{
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public string? Comments { get; set; }
}

// ===== OPPI SCIENTIST AWARD DTOs =====

public class ApplicantDetailDto
{
    public string? Title { get; set; }
    public string? First_Name { get; set; }
    public string? Middle_Name { get; set; }
    public string? Last_Name { get; set; }
    public string? Dob { get; set; }
    public string? Gender { get; set; }
    public string? Email { get; set; }
    public string? Telephone { get; set; }
    public string? Mobile { get; set; }
    public string? Discipline { get; set; }
    public string? Institute_Category { get; set; }
    public string? Institute_Name { get; set; }
}

public class ApplicationDetailDto
{
    public string? Category { get; set; }
    public string? Brief_Statement { get; set; }
    public string? Significant_Contribution { get; set; }
    public string? Impact_Contribution { get; set; }
    public bool? Has_Patent { get; set; }
    public bool? Has_Publication { get; set; }
}

public class PatentDto
{
    public int Id { get; set; }  // 0 for new
    public string? Title { get; set; }
    public string? Type { get; set; }
    public bool? Has_Attachment { get; set; }
    public bool? Is_Primary_Writer { get; set; }
    public int Sort_Order { get; set; }
    public string? Attachment_Path { get; set; }
    public string? Attachment_File_Name { get; set; }
}

public class PatentListDto
{
    public List<PatentDto> Patents { get; set; } = new();
}

public class PanelMemberDto
{
    public string Name { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Type { get; set; } = null!; // VALIDATOR, JURY, PANEL_CHAIR
    public string? ImagePath { get; set; }
    public int SortOrder { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class PastWinnerDto
{
    public int Year { get; set; }
    public string? YearStr { get; set; }
    public string Category { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Organisation { get; set; }
    public string? Description { get; set; }
    public string? Caption { get; set; }
    public string? Position { get; set; }
    public string? ImagePath { get; set; }
    public string? Color { get; set; }
}
