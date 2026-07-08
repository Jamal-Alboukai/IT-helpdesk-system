using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public interface IUserService
    {
        Task<List<UserListItemDTO>> GetAllUsersAsync();
        Task<List<AgentLookupDTO>> GetAgentsAsync();
        Task<UserResponseDTO?> GetUserByIdAsync(Guid id);
        Task<(UserResponseDTO? user, string? error)> CreateUserAsync(
            CreateUserDTO request, ClaimsPrincipal adminClaims);
        Task<(UserResponseDTO? user, string? error)> UpdateUserAsync(
            Guid id, UpdateUserDTO request);
        Task<bool> ToggleActiveAsync(Guid id);
        Task<List<LookupDTO>> GetRolesAsync();
         // ... existing methods stay exactly the same ...
    Task<ProfileResponseDTO?> GetProfileAsync(ClaimsPrincipal userClaims);
    Task<(ProfileResponseDTO? profile, string? error)> UpdateProfileAsync(
        ClaimsPrincipal userClaims, UpdateProfileDTO request);
    }

    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;
        private readonly IEmailService _emailService;

        public UserService(
            AppDbContext context,
            ITicketQueryHelper queryHelper,
            IEmailService emailService)
        {
            _context = context;
            _queryHelper = queryHelper;
            _emailService = emailService;
        }

        // ─── GET ALL USERS ────────────────────────────────────
        public async Task<List<UserListItemDTO>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .OrderBy(u => u.FirstName)
                .Select(u => new UserListItemDTO
                {
                    Id = u.Id,
                    FullName = $"{u.FirstName} {u.LastName}",
                    Email = u.Email,
                    Role = u.Role.Name,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();
        }

        // ─── GET AGENTS — for assign dropdown ─────────────────
        public async Task<List<AgentLookupDTO>> GetAgentsAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role.Name == RoleConstants.ITSupportAgent
                    && u.IsActive)
                .OrderBy(u => u.FirstName)
                .Select(u => new AgentLookupDTO
                {
                    Id = u.Id,
                    FullName = $"{u.FirstName} {u.LastName}",
                    Email = u.Email
                })
                .ToListAsync();
        }

        // ─── GET USER BY ID ───────────────────────────────────
        public async Task<UserResponseDTO?> GetUserByIdAsync(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;
            return MapToResponse(user);
        }

        // ─── CREATE USER — Admin only ─────────────────────────
        public async Task<(UserResponseDTO? user, string? error)>
            CreateUserAsync(CreateUserDTO request,
                ClaimsPrincipal adminClaims)
        {
            var (adminId, role) = _queryHelper.GetUserInfo(adminClaims);

            // Check email uniqueness
            var exists = await _context.Users
                .AnyAsync(u => u.Email == request.Email);
            if (exists)
                return (null, "Email already exists");

            // Validate role exists
            var roleEntity = await _context.Roles
                .FirstOrDefaultAsync(r => r.Id == request.RoleId);
            if (roleEntity == null)
                return (null, "Invalid role");

            // Hash temp password
            var passwordHash = BCrypt.Net.BCrypt
                .HashPassword(request.TempPassword);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = request.Email.Trim().ToLower(),
                PasswordHash = passwordHash,
                RoleId = request.RoleId,
                IsActive = true,
                IsEmailVerified = false,
                ForcePasswordChange = true,
                CreatedById = adminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send welcome email with temp password
            await _emailService.SendTicketAssignedEmailAsync(
                user.Email,
                $"{user.FirstName} {user.LastName}",
                "Welcome",
                $"Your temporary password is: {request.TempPassword}");

            var created = await _context.Users
                .Include(u => u.Role)
                .FirstAsync(u => u.Id == user.Id);

            return (MapToResponse(created), null);
        }

        // ─── UPDATE USER — Admin only ─────────────────────────
        public async Task<(UserResponseDTO? user, string? error)>
            UpdateUserAsync(Guid id, UpdateUserDTO request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return (null, "User not found");

            // Check email uniqueness if changed
            if (request.Email != null &&
                request.Email != user.Email)
            {
                var exists = await _context.Users
                    .AnyAsync(u => u.Email == request.Email
                        && u.Id != id);
                if (exists)
                    return (null, "Email already exists");
                user.Email = request.Email.Trim().ToLower();
            }

            if (request.FirstName != null)
                user.FirstName = request.FirstName.Trim();
            if (request.LastName != null)
                user.LastName = request.LastName.Trim();

            if (request.RoleId != null)
            {
                var roleExists = await _context.Roles
                    .AnyAsync(r => r.Id == request.RoleId);
                if (!roleExists)
                    return (null, "Invalid role");
                user.RoleId = request.RoleId.Value;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var updated = await _context.Users
                .Include(u => u.Role)
                .FirstAsync(u => u.Id == user.Id);

            return (MapToResponse(updated), null);
        }

        // ─── TOGGLE ACTIVE ────────────────────────────────────
        public async Task<bool> ToggleActiveAsync(Guid id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return false;

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        // ─── GET ROLES ────────────────────────────────────────
        public async Task<List<LookupDTO>> GetRolesAsync()
        {
            return await _context.Roles
                .Select(r => new LookupDTO
                {
                    Id = r.Id,
                    Name = r.Name
                })
                .ToListAsync();
        }

        // ─── Helper: Map to response ──────────────────────────
        private UserResponseDTO MapToResponse(User user)
        {
            return new UserResponseDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                Role = user.Role.Name,
                RoleId = user.RoleId,
                IsActive = user.IsActive,
                ForcePasswordChange = user.ForcePasswordChange,
                CreatedAt = user.CreatedAt
            };
        }
        // ─── GET PROFILE — any logged in user ─────────────────
        public async Task<ProfileResponseDTO?> GetProfileAsync(
            ClaimsPrincipal userClaims)
        {
            var userId = Guid.Parse(
                userClaims.FindFirst("nameid")!.Value);

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            return new ProfileResponseDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                Role = user.Role.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }

        // ─── UPDATE PROFILE — any logged in user ──────────────
        public async Task<(ProfileResponseDTO? profile, string? error)>
            UpdateProfileAsync(
                ClaimsPrincipal userClaims, UpdateProfileDTO request)
        {
            var userId = Guid.Parse(
                userClaims.FindFirst("nameid")!.Value);

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return (null, "User not found.");

            if (!string.IsNullOrWhiteSpace(request.FirstName))
                user.FirstName = request.FirstName.Trim();

            if (!string.IsNullOrWhiteSpace(request.LastName))
                user.LastName = request.LastName.Trim();

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (new ProfileResponseDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                Role = user.Role.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }, null);
        }
    }
    
}