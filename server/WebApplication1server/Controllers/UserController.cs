using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.DTOs;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // ─── GET ALL USERS — Admin only ───────────────────────
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userService.GetAllUsersAsync();
            return Ok(result);
        }

        // ─── GET AGENTS — Admin only (for assign dropdown) ────
        [HttpGet("agents")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAgents()
        {
            var result = await _userService.GetAgentsAsync();
            return Ok(result);
        }

        // ─── GET USER BY ID — Admin only ──────────────────────
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            var result = await _userService.GetUserByIdAsync(id);
            if (result == null)
                return NotFound(new { message = "User not found" });
            return Ok(result);
        }

        // ─── CREATE USER — Admin only ─────────────────────────
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUser(
            [FromBody] CreateUserDTO request)
        {
            if (string.IsNullOrEmpty(request.FirstName) ||
                string.IsNullOrEmpty(request.LastName) ||
                string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.TempPassword))
                return BadRequest(new { message = "All fields are required" });

            if (request.RoleId == Guid.Empty)
                return BadRequest(new { message = "Role is required" });

            var (user, error) = await _userService
                .CreateUserAsync(request, User);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(user);
        }

        // ─── UPDATE USER — Admin only ─────────────────────────
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(
            Guid id, [FromBody] UpdateUserDTO request)
        {
            var (user, error) = await _userService
                .UpdateUserAsync(id, request);

            if (error != null)
                return BadRequest(new { message = error });

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        // ─── TOGGLE ACTIVE — Admin only ───────────────────────
        [HttpPut("{id}/toggle-active")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleActive(Guid id)
        {
            var result = await _userService.ToggleActiveAsync(id);
            if (!result)
                return NotFound(new { message = "User not found" });
            return Ok(new { message = "User status updated" });
        }

        // ─── GET ROLES — Admin only ───────────────────────────
        [HttpGet("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles()
        {
            var result = await _userService.GetRolesAsync();
            return Ok(result);
        }
        // ─── GET MY PROFILE — all roles ───────────────────────
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var result = await _userService.GetProfileAsync(User);
            if (result == null)
                return NotFound(new { message = "Profile not found." });
            return Ok(result);
        }

        // ─── UPDATE MY PROFILE — all roles ────────────────────
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] UpdateProfileDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.FirstName) &&
                string.IsNullOrWhiteSpace(request.LastName))
                return BadRequest(new
                {
                    message = "At least one field is required."
                });

            var (profile, error) = await _userService
                .UpdateProfileAsync(User, request);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(profile);
        }
    }
}