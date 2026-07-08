namespace WebApplication1server.DTOs
{
    // ─── Create User — Admin only ─────────────────────────────
    public class CreateUserDTO
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TempPassword { get; set; } = string.Empty;
        public Guid RoleId { get; set; }
    }

    // ─── Update User — Admin only ─────────────────────────────
    public class UpdateUserDTO
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public Guid? RoleId { get; set; }
    }

    // ─── User Response ────────────────────────────────────────
    public class UserResponseDTO
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid RoleId { get; set; }
        public bool IsActive { get; set; }
        public bool ForcePasswordChange { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ─── User List Item (lighter for list view) ───────────────
    public class UserListItemDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ─── Agent Lookup (for assign dropdown) ───────────────────
    public class AgentLookupDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
    // ─── Profile DTOs (all roles) ─────────────────────────────────

public class ProfileResponseDTO
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileDTO
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
}