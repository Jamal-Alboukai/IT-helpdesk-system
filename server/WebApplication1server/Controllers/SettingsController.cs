using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.DTOs;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/settings")]
    [Authorize(Roles = "Admin")]  // entire controller — Admin only
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        // ─── CATEGORIES ───────────────────────────────────────

        // GET /api/settings/categories
        // Returns all categories including inactive — for admin management
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var result = await _settingsService.GetAllCategoriesAsync();
            return Ok(result);
        }

        // POST /api/settings/categories
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory(
            [FromBody] CreateCategoryDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Category name is required." });

            var (result, error) = await _settingsService
                .CreateCategoryAsync(request);

            if (error != null)
                return BadRequest(new { message = error });

            return CreatedAtAction(nameof(GetCategories), result);
        }

        // PUT /api/settings/categories/{id}
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(
            Guid id, [FromBody] UpdateCategoryDTO request)
        {
            var (result, error) = await _settingsService
                .UpdateCategoryAsync(id, request);

            if (error != null)
                return BadRequest(new { message = error });

            if (result == null)
                return NotFound(new { message = "Category not found." });

            return Ok(result);
        }

        // ─── PRIORITIES ───────────────────────────────────────

        // GET /api/settings/priorities
        [HttpGet("priorities")]
        public async Task<IActionResult> GetPriorities()
        {
            var result = await _settingsService.GetAllPrioritiesAsync();
            return Ok(result);
        }

        // POST /api/settings/priorities
        [HttpPost("priorities")]
        public async Task<IActionResult> CreatePriority(
            [FromBody] CreatePriorityDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Priority name is required." });

            if (request.DisplayOrder < 1)
                return BadRequest(new { message = "Display order must be 1 or higher." });

            var (result, error) = await _settingsService
                .CreatePriorityAsync(request);

            if (error != null)
                return BadRequest(new { message = error });

            return CreatedAtAction(nameof(GetPriorities), result);
        }

        // PUT /api/settings/priorities/{id}
        [HttpPut("priorities/{id}")]
        public async Task<IActionResult> UpdatePriority(
            Guid id, [FromBody] UpdatePriorityDTO request)
        {
            var (result, error) = await _settingsService
                .UpdatePriorityAsync(id, request);

            if (error != null)
                return BadRequest(new { message = error });

            if (result == null)
                return NotFound(new { message = "Priority not found." });

            return Ok(result);
        }

        // ─── STATUSES (view only) ─────────────────────────────

        // GET /api/settings/statuses
        // No POST/PUT — statuses are fixed workflow, cannot be added or removed
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var result = await _settingsService.GetAllStatusesAsync();
            return Ok(result);
        }
    }
}