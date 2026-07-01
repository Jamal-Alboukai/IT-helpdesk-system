using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;

namespace WebApplication1server.Services
{
    public interface IReportsService
    {
        Task<List<MonthlySummaryDTO>> GetMonthlySummaryAsync(int months);
        Task<List<AgentPerformanceDTO>> GetAgentPerformanceAsync();
    }

    public class ReportsService : IReportsService
    {
        private readonly AppDbContext _context;

        public ReportsService(AppDbContext context)
        {
            _context = context;
        }

        // ─── MONTHLY SUMMARY ──────────────────────────────────
        // Returns last N months of ticket data
        public async Task<List<MonthlySummaryDTO>> GetMonthlySummaryAsync(
            int months = 12)
        {
            var tickets = await _context.Tickets
                .Include(t => t.Status)
                .Where(t => t.CreatedAt >= DateTime.UtcNow.AddMonths(-months))
                .ToListAsync();

            // Build a list of the last N months (oldest → newest)
            var result = new List<MonthlySummaryDTO>();

            for (int i = months - 1; i >= 0; i--)
            {
                var date = DateTime.UtcNow.AddMonths(-i);
                var year = date.Year;
                var month = date.Month;

                var monthTickets = tickets
                    .Where(t => t.CreatedAt.Year == year &&
                                t.CreatedAt.Month == month)
                    .ToList();

                // Only tickets that were actually resolved
                var resolvedTickets = monthTickets
                    .Where(t => t.ResolvedAt.HasValue)
                    .ToList();

                var avgResolutionHours = resolvedTickets.Any()
                    ? resolvedTickets
                        .Average(t => (t.ResolvedAt!.Value - t.CreatedAt)
                            .TotalHours)
                    : 0;

                result.Add(new MonthlySummaryDTO
                {
                    Month = date.ToString("MMM yyyy"),
                    Year = year,
                    MonthNumber = month,
                    TotalCreated = monthTickets.Count,
                    Resolved = monthTickets.Count(t =>
                        t.StatusId == SeedConstants.ResolvedStatusId),
                    Closed = monthTickets.Count(t =>
                        t.StatusId == SeedConstants.ClosedStatusId),
                    Escalated = monthTickets.Count(t =>
                        t.EscalationRequested),
                    AvgResolutionHours = Math.Round(avgResolutionHours, 1)
                });
            }

            return result;
        }

        // ─── AGENT PERFORMANCE ────────────────────────────────
        public async Task<List<AgentPerformanceDTO>> GetAgentPerformanceAsync()
        {
            // Load all IT support agents
            var agents = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role.Name == RoleConstants.ITSupportAgent
                    && u.IsActive)
                .ToListAsync();

            // Load all tickets that have ever been assigned
            var tickets = await _context.Tickets
                .Where(t => t.AssignedToId.HasValue)
                .ToListAsync();

            var result = new List<AgentPerformanceDTO>();

            foreach (var agent in agents)
            {
                var agentTickets = tickets
                    .Where(t => t.AssignedToId == agent.Id)
                    .ToList();

                var resolvedTickets = agentTickets
                    .Where(t => t.ResolvedAt.HasValue)
                    .ToList();

                var avgResolutionHours = resolvedTickets.Any()
                    ? resolvedTickets
                        .Average(t => (t.ResolvedAt!.Value - t.CreatedAt)
                            .TotalHours)
                    : 0;

                var resolvedCount = agentTickets.Count(t =>
                    t.StatusId == SeedConstants.ResolvedStatusId);
                var closedCount = agentTickets.Count(t =>
                    t.StatusId == SeedConstants.ClosedStatusId);
                var activeCount = agentTickets.Count(t =>
                    t.StatusId == SeedConstants.OpenStatusId ||
                    t.StatusId == SeedConstants.InProgressStatusId ||
                    t.StatusId == SeedConstants.PendingStatusId);

                var total = agentTickets.Count;
                var resolutionRate = total > 0
                    ? Math.Round(
                        (double)(resolvedCount + closedCount) / total * 100, 1)
                    : 0;

                result.Add(new AgentPerformanceDTO
                {
                    AgentName = $"{agent.FirstName} {agent.LastName}",
                    Email = agent.Email,
                    TotalAssigned = total,
                    Resolved = resolvedCount,
                    Closed = closedCount,
                    ActiveTickets = activeCount,
                    AvgResolutionHours = Math.Round(avgResolutionHours, 1),
                    ResolutionRate = resolutionRate
                });
            }

            // Sort by resolution rate descending
            return result
                .OrderByDescending(a => a.ResolutionRate)
                .ToList();
        }
    }
}