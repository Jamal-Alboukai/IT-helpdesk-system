using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.DTOs;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin,Manager")]   // Agent and Employee never see Reports
    public class ReportsController : ControllerBase
    {
        private readonly IReportsService _reportsService;

        public ReportsController(IReportsService reportsService)
        {
            _reportsService = reportsService;
        }

        // GET /api/reports/monthly-summary?months=12
        [HttpGet("monthly-summary")]
        public async Task<IActionResult> GetMonthlySummary(
            [FromQuery] int months = 12)
        {
            if (months < 1 || months > 24)
                return BadRequest(new
                {
                    message = "Months must be between 1 and 24."
                });

            var result = await _reportsService.GetMonthlySummaryAsync(months);
            return Ok(result);
        }

        // GET /api/reports/agent-performance
        [HttpGet("agent-performance")]
        public async Task<IActionResult> GetAgentPerformance()
        {
            var result = await _reportsService.GetAgentPerformanceAsync();
            return Ok(result);
        }

        // GET /api/reports/summary — both in one call for the frontend
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(
            [FromQuery] int months = 12)
        {
            var monthly = await _reportsService.GetMonthlySummaryAsync(months);
            var agents = await _reportsService.GetAgentPerformanceAsync();

            return Ok(new ReportsSummaryDTO
            {
                MonthlySummary = monthly,
                AgentPerformance = agents,
                GeneratedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC"
            });
        }
    }
}