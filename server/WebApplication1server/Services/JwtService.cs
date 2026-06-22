using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user, string roleName);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, string roleName)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;
            var issuer = jwtSettings["Issuer"]!;
            var audience = jwtSettings["Audience"]!;
            var expiryInDays = int.Parse(jwtSettings["ExpiryInDays"]!);

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256);

            // Use short string claim names — not ClaimTypes URLs
            // This ensures frontend can decode them correctly
            var claims = new[]
            {
                new Claim("nameid", user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim("given_name", user.FirstName),
                new Claim("family_name", user.LastName),
                new Claim(ClaimTypes.Role, roleName),
                new Claim("ForcePasswordChange",
                    user.ForcePasswordChange.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(expiryInDays),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}