using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.DTOs;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/logs")]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogViewService _logService;

        public ActivityLogController(IActivityLogViewService logService)
        {
            _logService = logService;
        }

        // GET /api/logs
        // Admin + Manager: all logs
        // Agent: only logs on their assigned tickets
        // Employee: blocked
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,ITSupportAgent")]
        public async Task<IActionResult> GetLogs(
            [FromQuery] ActivityLogFilterDTO filter)
        {
            if (filter.PageSize > 50) filter.PageSize = 50;

            var result = await _logService.GetLogsAsync(filter, User);
            return Ok(result);
        }

        // GET /api/logs/action-types
        // Populates the action filter dropdown
        [HttpGet("action-types")]
        [Authorize(Roles = "Admin,Manager,ITSupportAgent")]
        public async Task<IActionResult> GetActionTypes()
        {
            var result = await _logService.GetActionTypesAsync();
            return Ok(result);
        }
    }
}