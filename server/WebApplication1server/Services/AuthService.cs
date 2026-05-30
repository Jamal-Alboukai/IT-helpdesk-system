using Microsoft.EntityFrameworkCore;
using WebApplication1server.Data;
using WebApplication1server.DTOs;

namespace WebApplication1server.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDTO?> LoginAsync(LoginRequestDTO request);
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
    }
}