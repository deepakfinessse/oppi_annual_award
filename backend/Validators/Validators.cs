using FluentValidation;
using OppiInnovationApi.DTOs;

namespace OppiInnovationApi.Validators;

public class RegisterValidator : AbstractValidator<RegisterDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Title).Must(x => string.IsNullOrEmpty(x) || new[] { "Mr", "Miss", "Mrs", "Dr" }.Contains(x)).WithMessage("Title must be Mr, Miss, Mrs, or Dr");
        RuleFor(x => x.First_Name).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Last_Name).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Dob).Must(x => string.IsNullOrEmpty(x) || System.Text.RegularExpressions.Regex.IsMatch(x, @"^\d{4}-\d{2}-\d{2}$")).WithMessage("Date of Birth is required in YYYY-MM-DD format");
        RuleFor(x => x.Gender).Must(x => string.IsNullOrEmpty(x) || new[] { "Male", "Female", "Others", "Other" }.Contains(x)).WithMessage("Gender must be Male or Female");
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^\d{10}$").WithMessage("Must be 10 digits");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Need uppercase")
            .Matches(@"[a-z]").WithMessage("Need lowercase")
            .Matches(@"\d").WithMessage("Need digit");
    }
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.Old_Password).NotEmpty();
        RuleFor(x => x.New_Password).NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Need uppercase")
            .Matches(@"[a-z]").WithMessage("Need lowercase")
            .Matches(@"\d").WithMessage("Need digit");
    }
}

public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Need uppercase")
            .Matches(@"[a-z]").WithMessage("Need lowercase")
            .Matches(@"\d").WithMessage("Need digit");
    }
}

public class ForgotPasswordValidator : AbstractValidator<ForgotPasswordDto>
{
    public ForgotPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
