using Microsoft.EntityFrameworkCore;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using System.Security.Claims;

namespace WebApplication1server.Services
{
    public class AuthResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
    }

    public interface IAuthService
    {
        Task<LoginResponseDTO?> LoginAsync(LoginRequestDTO request);
        Task<AuthResult> ChangePasswordAsync(
            ClaimsPrincipal userClaims,
            ChangePasswordDTO request);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthService(AppDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public async Task<LoginResponseDTO?> LoginAsync(LoginRequestDTO request)
        {
            // Find user by email
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            // User not found
            if (user == null) return null;

            // User is disabled
            if (!user.IsActive) return null;

            // Verify password using BCrypt — never decrypts, only compares
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!isPasswordValid) return null;

            // Generate JWT token with role embedded
            var token = _jwtService.GenerateToken(user, user.Role.Name);

            return new LoginResponseDTO
            {
                Token = token
            };
        }

        public async Task<AuthResult> ChangePasswordAsync(
            ClaimsPrincipal userClaims,
            ChangePasswordDTO request)
        {
            // Get user ID from token — using short claim name
            var userId = userClaims.FindFirst("nameid")?.Value;

            if (userId == null)
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid token"
                };

            // Find user in database
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == Guid.Parse(userId));

            if (user == null)
                return new AuthResult
                {
                    Success = false,
                    Message = "User not found"
                };

            // Verify current password
            bool isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                user.PasswordHash
            );

            if (!isCurrentPasswordValid)
                return new AuthResult
                {
                    Success = false,
                    Message = "Current password is incorrect"
                };

            // Hash new password and update
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword);
            user.ForcePasswordChange = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Issue new token with ForcePasswordChange = false
            var newToken = _jwtService.GenerateToken(user, user.Role.Name);

            return new AuthResult
            {
                Success = true,
                Message = "Password changed successfully",
                Token = newToken
            };
        }
    }
}