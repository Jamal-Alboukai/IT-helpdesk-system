using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public interface ICommentService
    {
        Task<List<CommentResponseDTO>> GetCommentsAsync(
            Guid ticketId, ClaimsPrincipal userClaims);
        Task<CommentResponseDTO?> AddCommentAsync(
            Guid ticketId, CreateCommentDTO request,
            ClaimsPrincipal userClaims);
        Task<List<ActivityLogResponseDTO>> GetTicketHistoryAsync(
            Guid ticketId, ClaimsPrincipal userClaims);
    }

    public class CommentService : ICommentService
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;
        private readonly ITicketQueryHelper _queryHelper;
        private readonly INotificationService _notificationService;

        public CommentService(
            AppDbContext context,
            IActivityLogService activityLog,
            ITicketQueryHelper queryHelper,
            INotificationService notificationService)
        {
            _context = context;
            _activityLog = activityLog;
            _queryHelper = queryHelper;
            _notificationService = notificationService;
        }

        // ─── Helper: Check ticket access ──────────────────────
        private async Task<Ticket?> GetAccessibleTicketAsync(
            Guid ticketId, Guid userId, string role)
        {
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null) return null;

            // Employee — own tickets only
            if (role == RoleConstants.Employee &&
                ticket.CreatedById != userId)
                return null;

            // Agent — assigned tickets only
            if (role == RoleConstants.ITSupportAgent &&
                ticket.AssignedToId != userId)
                return null;

            // Manager — read only access
            // Admin — full access
            return ticket;
        }

        // ─── GET COMMENTS ─────────────────────────────────────
        public async Task<List<CommentResponseDTO>> GetCommentsAsync(
            Guid ticketId, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await GetAccessibleTicketAsync(
                ticketId, userId, role);
            if (ticket == null) return new List<CommentResponseDTO>();

            var query = _context.TicketComments
                .Include(c => c.Author)
                    .ThenInclude(a => a.Role)
                .Where(c => c.TicketId == ticketId);

            // Employee and Manager cannot see internal notes
            if (role == RoleConstants.Employee ||
                role == RoleConstants.Manager)
                query = query.Where(c => !c.IsInternal);

            var comments = await query
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return comments.Select(c => new CommentResponseDTO
            {
                Id = c.Id,
                TicketId = c.TicketId,
                Content = c.Content,
                IsInternal = c.IsInternal,
                AuthorName = $"{c.Author.FirstName} {c.Author.LastName}",
                AuthorId = c.AuthorId,
                AuthorRole = c.Author.Role.Name,
                CreatedAt = c.CreatedAt
            }).ToList();
        }

        // ─── ADD COMMENT ──────────────────────────────────────
        public async Task<CommentResponseDTO?> AddCommentAsync(
            Guid ticketId, CreateCommentDTO request,
            ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await GetAccessibleTicketAsync(
                ticketId, userId, role);
            if (ticket == null) return null;

            // Manager cannot add comments
            if (role == RoleConstants.Manager) return null;

            // Employee cannot add internal notes
            if (role == RoleConstants.Employee && request.IsInternal)
                return null;

            // Cannot comment on closed tickets
            if (ticket.StatusId == SeedConstants.ClosedStatusId)
                return null;

            var comment = new TicketComment
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                AuthorId = userId,
                Content = request.Content,
                IsInternal = request.IsInternal,
                CreatedAt = DateTime.UtcNow
            };

            _context.TicketComments.Add(comment);
            await _context.SaveChangesAsync();

            // Log the comment
            await _activityLog.LogAsync(
                userId: userId,
                action: request.IsInternal
                    ? "Internal Note Added"
                    : "Comment Added",
                ticketId: ticketId,
                newValue: request.Content.Length > 100
                    ? request.Content[..100] + "..."
                    : request.Content
            );

            // Notify relevant users about the new comment
            await _notificationService.NotifyCommentAddedAsync(
                ticket, userId, request.IsInternal);

            // Reload with includes
            var created = await _context.TicketComments
                .Include(c => c.Author)
                    .ThenInclude(a => a.Role)
                .FirstAsync(c => c.Id == comment.Id);

            return new CommentResponseDTO
            {
                Id = created.Id,
                TicketId = created.TicketId,
                Content = created.Content,
                IsInternal = created.IsInternal,
                AuthorName = $"{created.Author.FirstName} {created.Author.LastName}",
                AuthorId = created.AuthorId,
                AuthorRole = created.Author.Role.Name,
                CreatedAt = created.CreatedAt
            };
        }

        // ─── GET TICKET HISTORY ───────────────────────────────
        public async Task<List<ActivityLogResponseDTO>> GetTicketHistoryAsync(
            Guid ticketId, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await GetAccessibleTicketAsync(
                ticketId, userId, role);
            if (ticket == null) return new List<ActivityLogResponseDTO>();

            var logs = await _context.ActivityLogs
                .Include(l => l.User)
                .Where(l => l.TicketId == ticketId)
                .OrderBy(l => l.CreatedAt)
                .ToListAsync();

            return logs.Select(l => new ActivityLogResponseDTO
            {
                Id = l.Id,
                Action = l.Action,
                OldValue = l.OldValue,
                NewValue = l.NewValue,
                PerformedBy = $"{l.User.FirstName} {l.User.LastName}",
                CreatedAt = l.CreatedAt
            }).ToList();
        }
    }
}