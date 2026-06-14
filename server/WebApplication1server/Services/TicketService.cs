using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Helpers;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public interface ITicketService
    {
        Task<PaginatedResponseDTO<TicketListResponseDTO>> GetTicketsAsync(
            TicketFilterDTO filter, ClaimsPrincipal userClaims);
        Task<TicketResponseDTO?> GetTicketByIdAsync(
            Guid id, ClaimsPrincipal userClaims);
        Task<TicketResponseDTO> CreateTicketAsync(
            CreateTicketDTO request, ClaimsPrincipal userClaims);
        Task<(TicketResponseDTO? ticket, string? error)> UpdateTicketAsync(
            Guid id, UpdateTicketDTO request, ClaimsPrincipal userClaims);
        Task<bool> DeleteTicketAsync(
            Guid id, ClaimsPrincipal userClaims);
    }

    public class TicketService : ITicketService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;
        private readonly IActivityLogService _activityLog;
        private readonly INotificationService _notificationService;

        public TicketService(
            AppDbContext context,
            ITicketQueryHelper queryHelper,
            IActivityLogService activityLog,
            INotificationService notificationService)
        {
            _context = context;
            _queryHelper = queryHelper;
            _activityLog = activityLog;
            _notificationService = notificationService;
        }

        // ─── GET ALL TICKETS ──────────────────────────────────
        public async Task<PaginatedResponseDTO<TicketListResponseDTO>> GetTicketsAsync(
            TicketFilterDTO filter, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);
            var query = _queryHelper.BaseTicketQuery();

            // Role-based filtering
            if (role == RoleConstants.Employee)
                query = query.Where(t => t.CreatedById == userId);
            else if (role == RoleConstants.ITSupportAgent)
                query = query.Where(t => t.AssignedToId == userId);

            // Search
            if (!string.IsNullOrEmpty(filter.Search))
                query = query.Where(t =>
                    t.Title.Contains(filter.Search) ||
                    t.ReferenceNumber.Contains(filter.Search) ||
                    t.Description.Contains(filter.Search));

            // Filters
            if (filter.CategoryId.HasValue)
                query = query.Where(t => t.CategoryId == filter.CategoryId);
            if (filter.PriorityId.HasValue)
                query = query.Where(t => t.PriorityId == filter.PriorityId);
            if (filter.StatusId.HasValue)
                query = query.Where(t => t.StatusId == filter.StatusId);
            if (filter.EscalationRequested.HasValue)
                query = query.Where(t =>
                    t.EscalationRequested == filter.EscalationRequested);

            var totalCount = await query.CountAsync();

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PaginatedResponseDTO<TicketListResponseDTO>
            {
                Data = tickets.Select(t => new TicketListResponseDTO
                {
                    Id = t.Id,
                    ReferenceNumber = t.ReferenceNumber,
                    Title = t.Title,
                    Category = t.Category.Name,
                    Priority = t.Priority.Name,
                    Status = t.Status.Name,
                    CreatedBy = $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}",
                    AssignedTo = t.AssignedTo != null
                        ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}"
                        : null,
                    EscalationRequested = t.EscalationRequested,
                    CreatedAt = t.CreatedAt,
                    DueAt = t.DueAt
                }).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(
                    (double)totalCount / filter.PageSize)
            };
        }

        // ─── GET TICKET BY ID ─────────────────────────────────
        public async Task<TicketResponseDTO?> GetTicketByIdAsync(
            Guid id, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await _queryHelper.BaseTicketQuery()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return null;

            if (role == RoleConstants.Employee &&
                ticket.CreatedById != userId) return null;
            if (role == RoleConstants.ITSupportAgent &&
                ticket.AssignedToId != userId) return null;

            return _queryHelper.MapToResponse(ticket);
        }

        // ─── CREATE TICKET ────────────────────────────────────
        public async Task<TicketResponseDTO> CreateTicketAsync(
            CreateTicketDTO request, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = await _queryHelper
                    .GenerateReferenceNumberAsync(),
                Title = request.Title,
                Description = request.Description,
                CategoryId = request.CategoryId,
                PriorityId = request.PriorityId,
                StatusId = SeedConstants.OpenStatusId,
                CreatedById = userId,
                LastUpdatedById = userId,
                DueAt = request.DueAt,
                EscalationRequested = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            await _activityLog.LogAsync(
                userId: userId,
                action: "Ticket Created",
                ticketId: ticket.Id,
                newValue: ticket.ReferenceNumber);

            var created = await _queryHelper.BaseTicketQuery()
                .FirstAsync(t => t.Id == ticket.Id);

            return _queryHelper.MapToResponse(created);
        }

        // ─── UPDATE TICKET ────────────────────────────────────
        // Returns (ticket, error) — error is null on success
        public async Task<(TicketResponseDTO? ticket, string? error)> UpdateTicketAsync(
            Guid id, UpdateTicketDTO request, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await _queryHelper.BaseTicketQuery()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return (null, "Ticket not found");

            // ── Employee ──────────────────────────────────────
            if (role == RoleConstants.Employee)
            {
                if (ticket.CreatedById != userId)
                    return (null, "Access denied");
                if (ticket.StatusId != SeedConstants.OpenStatusId)
                    return (null, "You can only edit Open tickets");

                if (request.Title != null)
                {
                    await _activityLog.LogAsync(userId, "Title Updated",
                        ticket.Id, ticket.Title, request.Title);
                    ticket.Title = request.Title;
                }
                if (request.Description != null)
                {
                    await _activityLog.LogAsync(userId, "Description Updated",
                        ticket.Id, ticket.Description, request.Description);
                    ticket.Description = request.Description;
                }
                if (request.DueAt != null) ticket.DueAt = request.DueAt;
            }

            // ── ITSupportAgent ────────────────────────────────
            else if (role == RoleConstants.ITSupportAgent)
            {
                if (ticket.AssignedToId != userId)
                    return (null, "Access denied");

                if (request.StatusId != null)
                {
                    // ── Validate status transition ─────────────
                    if (!StatusTransitionHelper.IsValidTransition(
                        ticket.StatusId, request.StatusId.Value))
                    {
                        var allowed = StatusTransitionHelper
                            .GetAllowedNextStatuses(ticket.StatusId);
                        var allowedNames = await _context.Statuses
                            .Where(s => allowed.Contains(s.Id))
                            .Select(s => s.Name)
                            .ToListAsync();
                        return (null,
                            $"Invalid status transition. Allowed: " +
                            $"{string.Join(", ", allowedNames)}");
                    }

                    var oldStatus = ticket.Status.Name;
                    var newStatusName = await _context.Statuses
                        .Where(s => s.Id == request.StatusId.Value)
                        .Select(s => s.Name)
                        .FirstOrDefaultAsync();

                    ticket.StatusId = request.StatusId.Value;

                    await _activityLog.LogAsync(userId, "Status Changed",
                        ticket.Id, oldStatus, newStatusName);

                    // Notify ticket creator of status change
                    await _notificationService.NotifyStatusChangedAsync(
                        ticket, oldStatus, newStatusName ?? string.Empty);

                    if (request.StatusId == SeedConstants.ResolvedStatusId)
                    {
                        ticket.ResolvedById = userId;
                        ticket.ResolvedAt = DateTime.UtcNow;
                    }
                }

                if (request.CategoryId != null)
                {
                    await _activityLog.LogAsync(userId, "Category Updated",
                        ticket.Id, ticket.Category.Name,
                        request.CategoryId.ToString());
                    ticket.CategoryId = request.CategoryId.Value;
                }
                if (request.PriorityId != null)
                {
                    await _activityLog.LogAsync(userId, "Priority Updated",
                        ticket.Id, ticket.Priority.Name,
                        request.PriorityId.ToString());
                    ticket.PriorityId = request.PriorityId.Value;
                }
                if (request.EscalationRequested == true)
                {
                    ticket.EscalationRequested = true;
                    ticket.EscalationNote = request.EscalationNote;
                    await _activityLog.LogAsync(userId,
                        "Escalation Requested",
                        ticket.Id, null, request.EscalationNote);
                }
            }

            // ── Admin ─────────────────────────────────────────
            else if (role == RoleConstants.Admin)
            {
                if (request.Title != null)
                {
                    await _activityLog.LogAsync(userId, "Title Updated",
                        ticket.Id, ticket.Title, request.Title);
                    ticket.Title = request.Title;
                }
                if (request.Description != null)
                {
                    await _activityLog.LogAsync(userId, "Description Updated",
                        ticket.Id, ticket.Description, request.Description);
                    ticket.Description = request.Description;
                }
                if (request.CategoryId != null)
                {
                    await _activityLog.LogAsync(userId, "Category Updated",
                        ticket.Id, ticket.Category.Name,
                        request.CategoryId.ToString());
                    ticket.CategoryId = request.CategoryId.Value;
                }
                if (request.PriorityId != null)
                {
                    await _activityLog.LogAsync(userId, "Priority Updated",
                        ticket.Id, ticket.Priority.Name,
                        request.PriorityId.ToString());
                    ticket.PriorityId = request.PriorityId.Value;
                }
                if (request.DueAt != null) ticket.DueAt = request.DueAt;

                if (request.StatusId != null)
                {
                    // ── Admin also validates transitions ───────
                    if (!StatusTransitionHelper.IsValidTransition(
                        ticket.StatusId, request.StatusId.Value))
                    {
                        var allowed = StatusTransitionHelper
                            .GetAllowedNextStatuses(ticket.StatusId);
                        var allowedNames = await _context.Statuses
                            .Where(s => allowed.Contains(s.Id))
                            .Select(s => s.Name)
                            .ToListAsync();
                        return (null,
                            $"Invalid status transition. Allowed: " +
                            $"{string.Join(", ", allowedNames)}");
                    }

                    var oldStatus = ticket.Status.Name;
                    var newStatusName = await _context.Statuses
                        .Where(s => s.Id == request.StatusId.Value)
                        .Select(s => s.Name)
                        .FirstOrDefaultAsync();

                    ticket.StatusId = request.StatusId.Value;

                    await _activityLog.LogAsync(userId, "Status Changed",
                        ticket.Id, oldStatus, newStatusName);

                    // Notify on status change
                    await _notificationService.NotifyStatusChangedAsync(
                        ticket, oldStatus, newStatusName ?? string.Empty);

                    if (request.StatusId == SeedConstants.ResolvedStatusId)
                    {
                        ticket.ResolvedById = userId;
                        ticket.ResolvedAt = DateTime.UtcNow;
                    }
                    if (request.StatusId == SeedConstants.ClosedStatusId)
                    {
                        ticket.ClosedById = userId;
                        ticket.ClosedAt = DateTime.UtcNow;
                    }
                }

                if (request.AssignedToId != null)
                {
                    var assignedUser = await _context.Users
                        .FirstOrDefaultAsync(u =>
                            u.Id == request.AssignedToId);
                    await _activityLog.LogAsync(userId, "Ticket Assigned",
                        ticket.Id, ticket.AssignedTo?.FirstName,
                        $"{assignedUser?.FirstName} {assignedUser?.LastName}");

                    ticket.AssignedToId = request.AssignedToId;
                    ticket.EscalationRequested = false;
                    ticket.EscalationNote = null;
                    ticket.StatusId = SeedConstants.InProgressStatusId;
                }
            }

            // ── Manager — read only ───────────────────────────
            else if (role == RoleConstants.Manager)
            {
                return (null, "Managers have read-only access");
            }

            ticket.LastUpdatedById = userId;
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var updated = await _queryHelper.BaseTicketQuery()
                .FirstAsync(t => t.Id == ticket.Id);

            return (_queryHelper.MapToResponse(updated), null);
        }

        // ─── DELETE TICKET ────────────────────────────────────
        public async Task<bool> DeleteTicketAsync(
            Guid id, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return false;

            if (role == RoleConstants.Employee)
            {
                if (ticket.CreatedById != userId) return false;
                if (ticket.StatusId != SeedConstants.OpenStatusId) return false;
            }
            else if (role == RoleConstants.ITSupportAgent ||
                     role == RoleConstants.Manager)
            {
                return false;
            }

            // Soft delete — set to Closed
            ticket.StatusId = SeedConstants.ClosedStatusId;
            ticket.ClosedById = userId;
            ticket.ClosedAt = DateTime.UtcNow;
            ticket.LastUpdatedById = userId;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _activityLog.LogAsync(
                userId: userId,
                action: "Ticket Closed",
                ticketId: ticket.Id);

            return true;
        }
    }
}