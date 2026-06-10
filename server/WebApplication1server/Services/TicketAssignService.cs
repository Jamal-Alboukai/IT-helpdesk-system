using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;

namespace WebApplication1server.Services
{
    public interface ITicketAssignService
    {
        Task<TicketResponseDTO?> AssignTicketAsync(Guid id, AssignTicketDTO request, ClaimsPrincipal userClaims);
        Task<TicketResponseDTO?> RequestEscalationAsync(Guid id, EscalationRequestDTO request, ClaimsPrincipal userClaims);
    }

    public class TicketAssignService : ITicketAssignService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;
        private readonly IActivityLogService _activityLog;

        public TicketAssignService(
            AppDbContext context,
            ITicketQueryHelper queryHelper,
            IActivityLogService activityLog)
        {
            _context = context;
            _queryHelper = queryHelper;
            _activityLog = activityLog;
        }

        // ─── ASSIGN TICKET — Admin only ───────────────────────
        public async Task<TicketResponseDTO?> AssignTicketAsync(
            Guid id, AssignTicketDTO request, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            if (role != RoleConstants.Admin) return null;

            var ticket = await _queryHelper.BaseTicketQuery()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return null;

            // Verify assigned user is ITSupportAgent
            var assignedUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == request.AssignedToId);

            if (assignedUser == null) return null;
            if (assignedUser.Role.Name != RoleConstants.ITSupportAgent) return null;

            var oldAssignee = ticket.AssignedTo != null
                ? $"{ticket.AssignedTo.FirstName} {ticket.AssignedTo.LastName}"
                : "Unassigned";

            ticket.AssignedToId = request.AssignedToId;
            ticket.StatusId = SeedConstants.InProgressStatusId;
            ticket.EscalationRequested = false;
            ticket.EscalationNote = null;
            ticket.LastUpdatedById = userId;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log assignment
            await _activityLog.LogAsync(
                userId: userId,
                action: "Ticket Assigned",
                ticketId: ticket.Id,
                oldValue: oldAssignee,
                newValue: $"{assignedUser.FirstName} {assignedUser.LastName}"
            );

            var updated = await _queryHelper.BaseTicketQuery()
                .FirstAsync(t => t.Id == ticket.Id);

            return _queryHelper.MapToResponse(updated);
        }

        // ─── REQUEST ESCALATION — ITSupportAgent only ─────────
        public async Task<TicketResponseDTO?> RequestEscalationAsync(
            Guid id, EscalationRequestDTO request, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            if (role != RoleConstants.ITSupportAgent) return null;

            var ticket = await _queryHelper.BaseTicketQuery()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return null;

            if (ticket.AssignedToId != userId) return null;

            ticket.EscalationRequested = true;
            ticket.EscalationNote = request.EscalationNote;
            ticket.LastUpdatedById = userId;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log escalation request
            await _activityLog.LogAsync(
                userId: userId,
                action: "Escalation Requested",
                ticketId: ticket.Id,
                newValue: request.EscalationNote
            );

            var updated = await _queryHelper.BaseTicketQuery()
                .FirstAsync(t => t.Id == ticket.Id);

            return _queryHelper.MapToResponse(updated);
        }
    }
}