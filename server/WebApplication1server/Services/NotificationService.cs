using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;
using WebApplication1server.Hubs;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    // ─── Notification Response DTO ────────────────────────────
    public class NotificationResponseDTO
    {
        public Guid Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? TicketId { get; set; }
        public string? TicketReference { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public interface INotificationService
    {
        // Create notifications
        Task NotifyTicketAssignedAsync(Ticket ticket, Guid agentId);
        Task NotifyStatusChangedAsync(Ticket ticket, string oldStatus, string newStatus);
        Task NotifyCommentAddedAsync(Ticket ticket, Guid commentAuthorId, bool isInternal);

        // Read notifications
        Task<List<NotificationResponseDTO>> GetMyNotificationsAsync(ClaimsPrincipal userClaims);
        Task<int> GetUnreadCountAsync(ClaimsPrincipal userClaims);
        Task<bool> MarkAsReadAsync(Guid notificationId, ClaimsPrincipal userClaims);
        Task MarkAllAsReadAsync(ClaimsPrincipal userClaims);
    }

    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            AppDbContext context,
            ITicketQueryHelper queryHelper,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _queryHelper = queryHelper;
            _hubContext = hubContext;
        }

        // ─── Helper: Create notification + push via SignalR ───
        private async Task CreateAsync(
            Guid userId, string message, Guid? ticketId = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TicketId = ticketId,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // ─── Push real-time via SignalR ───────────────────
            // Send to the user's group (userId = group name)
            await _hubContext.Clients
                .Group(userId.ToString())
                .SendAsync("ReceiveNotification", new NotificationResponseDTO
                {
                    Id = notification.Id,
                    Message = notification.Message,
                    TicketId = notification.TicketId,
                    TicketReference = ticketId.HasValue
                        ? await _context.Tickets
                            .Where(t => t.Id == ticketId)
                            .Select(t => t.ReferenceNumber)
                            .FirstOrDefaultAsync()
                        : null,
                    IsRead = false,
                    CreatedAt = notification.CreatedAt
                });
        }

        // ─── NOTIFY: Ticket Assigned ──────────────────────────
        public async Task NotifyTicketAssignedAsync(
            Ticket ticket, Guid agentId)
        {
            await CreateAsync(
                userId: agentId,
                message: $"Ticket {ticket.ReferenceNumber} has been assigned to you: \"{ticket.Title}\"",
                ticketId: ticket.Id
            );
        }

        // ─── NOTIFY: Status Changed ───────────────────────────
        public async Task NotifyStatusChangedAsync(
            Ticket ticket, string oldStatus, string newStatus)
        {
            // Notify the employee who created the ticket
            await CreateAsync(
                userId: ticket.CreatedById,
                message: $"Ticket {ticket.ReferenceNumber} status changed from \"{oldStatus}\" to \"{newStatus}\"",
                ticketId: ticket.Id
            );

            // Also notify assigned agent if status changed by admin
            if (ticket.AssignedToId.HasValue &&
                ticket.AssignedToId != ticket.CreatedById)
            {
                await CreateAsync(
                    userId: ticket.AssignedToId.Value,
                    message: $"Ticket {ticket.ReferenceNumber} status changed from \"{oldStatus}\" to \"{newStatus}\"",
                    ticketId: ticket.Id
                );
            }
        }

        // ─── NOTIFY: Comment Added ────────────────────────────
        public async Task NotifyCommentAddedAsync(
            Ticket ticket, Guid commentAuthorId, bool isInternal)
        {
            // Internal notes — only notify admin users
            if (isInternal)
            {
                var admins = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.Role.Name == RoleConstants.Admin
                        && u.Id != commentAuthorId
                        && u.IsActive)
                    .ToListAsync();

                foreach (var admin in admins)
                {
                    await CreateAsync(
                        userId: admin.Id,
                        message: $"Internal note added on ticket {ticket.ReferenceNumber}",
                        ticketId: ticket.Id
                    );
                }
                return;
            }

            // Public comment — notify creator if not the author
            if (ticket.CreatedById != commentAuthorId)
            {
                await CreateAsync(
                    userId: ticket.CreatedById,
                    message: $"New comment on your ticket {ticket.ReferenceNumber}: \"{ticket.Title}\"",
                    ticketId: ticket.Id
                );
            }

            // Notify assigned agent if not the author
            if (ticket.AssignedToId.HasValue &&
                ticket.AssignedToId != commentAuthorId)
            {
                await CreateAsync(
                    userId: ticket.AssignedToId.Value,
                    message: $"New comment on ticket {ticket.ReferenceNumber}: \"{ticket.Title}\"",
                    ticketId: ticket.Id
                );
            }
        }

        // ─── GET MY NOTIFICATIONS ─────────────────────────────
        public async Task<List<NotificationResponseDTO>> GetMyNotificationsAsync(
            ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var notifications = await _context.Notifications
                .Include(n => n.Ticket)
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return notifications.Select(n => new NotificationResponseDTO
            {
                Id = n.Id,
                Message = n.Message,
                TicketId = n.TicketId,
                TicketReference = n.Ticket?.ReferenceNumber,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedAt = n.CreatedAt
            }).ToList();
        }

        // ─── GET UNREAD COUNT ─────────────────────────────────
        public async Task<int> GetUnreadCountAsync(
            ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        // ─── MARK AS READ ─────────────────────────────────────
        public async Task<bool> MarkAsReadAsync(
            Guid notificationId, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.Id == notificationId &&
                    n.UserId == userId);

            if (notification == null) return false;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // ─── MARK ALL AS READ ─────────────────────────────────
        public async Task MarkAllAsReadAsync(ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}