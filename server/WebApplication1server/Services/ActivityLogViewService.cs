using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;

namespace WebApplication1server.Services
{
    public interface IActivityLogViewService
    {
        Task<ActivityLogPagedDTO> GetLogsAsync(
            ActivityLogFilterDTO filter, ClaimsPrincipal userClaims);
        Task<List<ActionTypeDTO>> GetActionTypesAsync();
    }

    public class ActivityLogViewService : IActivityLogViewService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;

        public ActivityLogViewService(
            AppDbContext context,
            ITicketQueryHelper queryHelper)
        {
            _context = context;
            _queryHelper = queryHelper;
        }

        public async Task<ActivityLogPagedDTO> GetLogsAsync(
            ActivityLogFilterDTO filter, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var query = _context.ActivityLogs
                .Include(l => l.User)
                    .ThenInclude(u => u.Role)
                .Include(l => l.Ticket)
                .AsQueryable();

            // ─── Role scoping ──────────────────────────────────
            // Admin sees all logs
            // Manager sees all logs
            // Agent sees only logs on their assigned tickets
            if (role == RoleConstants.ITSupportAgent)
            {
                var assignedTicketIds = await _context.Tickets
                    .Where(t => t.AssignedToId == userId)
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(l =>
                    l.TicketId.HasValue &&
                    assignedTicketIds.Contains(l.TicketId.Value));
            }

            // ─── Filters ───────────────────────────────────────
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.ToLower();
                query = query.Where(l =>
                    l.Action.ToLower().Contains(s) ||
                    l.User.FirstName.ToLower().Contains(s) ||
                    l.User.LastName.ToLower().Contains(s) ||
                    (l.Ticket != null &&
                        l.Ticket.ReferenceNumber.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Action))
                query = query.Where(l => l.Action == filter.Action);

            if (filter.UserId.HasValue)
                query = query.Where(l => l.UserId == filter.UserId.Value);

            if (filter.TicketId.HasValue)
                query = query.Where(l => l.TicketId == filter.TicketId.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(l =>
                    l.CreatedAt >= filter.FromDate.Value.ToUniversalTime());

            if (filter.ToDate.HasValue)
                query = query.Where(l =>
                    l.CreatedAt <= filter.ToDate.Value
                        .ToUniversalTime()
                        .AddDays(1)       // inclusive of the end date
                        .AddSeconds(-1));

            // ─── Count before pagination ───────────────────────
            var totalCount = await query.CountAsync();

            // ─── Sort + paginate ───────────────────────────────
            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new ActivityLogPagedDTO
            {
                Data = logs.Select(l => new ActivityLogDetailDTO
                {
                    Id = l.Id,
                    Action = l.Action,
                    OldValue = l.OldValue,
                    NewValue = l.NewValue,
                    PerformedBy = $"{l.User.FirstName} {l.User.LastName}",
                    PerformedById = l.UserId,
                    PerformedByRole = l.User.Role.Name,
                    TicketReference = l.Ticket?.ReferenceNumber,
                    TicketId = l.TicketId,
                    TicketTitle = l.Ticket?.Title,
                    CreatedAt = l.CreatedAt
                }).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(
                    (double)totalCount / filter.PageSize)
            };
        }

        // Returns distinct action types for the filter dropdown
        public async Task<List<ActionTypeDTO>> GetActionTypesAsync()
        {
            var actions = await _context.ActivityLogs
                .Select(l => l.Action)
                .Distinct()
                .OrderBy(a => a)
                .ToListAsync();

            return actions.Select(a => new ActionTypeDTO
            {
                Action = a
            }).ToList();
        }
    }
}