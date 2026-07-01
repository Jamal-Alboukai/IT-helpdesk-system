using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;

namespace WebApplication1server.Services
{
    public interface IDashboardService
    {
        Task<DashboardStatsDTO> GetStatsAsync(ClaimsPrincipal userClaims);
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;

        public DashboardService(
            AppDbContext context,
            ITicketQueryHelper queryHelper)
        {
            _context = context;
            _queryHelper = queryHelper;
        }

        public async Task<DashboardStatsDTO> GetStatsAsync(
            ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            // ─── Base query filtered by role ──────────────────
            var query = _context.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .AsQueryable();

            if (role == RoleConstants.Employee)
                query = query.Where(t => t.CreatedById == userId);
            else if (role == RoleConstants.ITSupportAgent)
                query = query.Where(t => t.AssignedToId == userId);
            // Manager and Admin see all

            var tickets = await query.ToListAsync();

            // ─── KPI Cards ────────────────────────────────────
            var stats = new DashboardStatsDTO
            {
                TotalTickets = tickets.Count,
                OpenTickets = tickets.Count(t =>
                    t.StatusId == SeedConstants.OpenStatusId),
                InProgressTickets = tickets.Count(t =>
                    t.StatusId == SeedConstants.InProgressStatusId),
                PendingTickets = tickets.Count(t =>
                    t.StatusId == SeedConstants.PendingStatusId),
                ResolvedTickets = tickets.Count(t =>
                    t.StatusId == SeedConstants.ResolvedStatusId),
                ClosedTickets = tickets.Count(t =>
                    t.StatusId == SeedConstants.ClosedStatusId),
                CriticalTickets = tickets.Count(t =>
                    t.PriorityId == SeedConstants.CriticalPriorityId),
                EscalatedTickets = tickets.Count(t =>
                    t.EscalationRequested)
            };

            // ─── Tickets by category ──────────────────────────
            stats.TicketsByCategory = tickets
                .GroupBy(t => t.Category.Name)
                .Select(g => new ChartDataDTO
                {
                    Label = g.Key,
                    Value = g.Count(),
                    Color = GetCategoryColor(g.Key)
                })
                .OrderByDescending(x => x.Value)
                .ToList();

            // ─── Tickets by priority ──────────────────────────
            stats.TicketsByPriority = tickets
                .GroupBy(t => t.Priority.Name)
                .Select(g => new ChartDataDTO
                {
                    Label = g.Key,
                    Value = g.Count(),
                    Color = GetPriorityColor(g.Key)
                })
                .OrderByDescending(x => x.Value)
                .ToList();

            // ─── Tickets by status ────────────────────────────
            stats.TicketsByStatus = tickets
                .GroupBy(t => t.Status.Name)
                .Select(g => new ChartDataDTO
                {
                    Label = g.Key,
                    Value = g.Count(),
                    Color = GetStatusColor(g.Key)
                })
                .OrderByDescending(x => x.Value)
                .ToList();

            // ─── Tickets over last 7 days ─────────────────────
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.UtcNow.Date.AddDays(-6 + i))
                .ToList();

            stats.TicketsOverTime = last7Days.Select(date =>
                new TimeSeriesDTO
                {
                    Date = date.ToString("MMM dd"),
                    Count = tickets.Count(t =>
                        t.CreatedAt.Date == date)
                }).ToList();

            return stats;
        }

        // ─── Color helpers ────────────────────────────────────
        private static string GetCategoryColor(string category) =>
            category switch
            {
                "Hardware" => "#3b82f6",
                "Software" => "#8b5cf6",
                "Network" => "#06b6d4",
                "Email" => "#f59e0b",
                "Access Request" => "#10b981",
                _ => "#6b7280"
            };

        private static string GetPriorityColor(string priority) =>
            priority switch
            {
                "Critical" => "#ef4444",
                "High" => "#f97316",
                "Medium" => "#eab308",
                "Low" => "#22c55e",
                _ => "#6b7280"
            };

        private static string GetStatusColor(string status) =>
            status switch
            {
                "Open" => "#3b82f6",
                "In Progress" => "#8b5cf6",
                "Pending" => "#eab308",
                "Resolved" => "#22c55e",
                "Closed" => "#6b7280",
                _ => "#6b7280"
            };
    }
}