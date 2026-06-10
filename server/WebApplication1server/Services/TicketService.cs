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
        Task<TicketResponseDTO?> UpdateTicketAsync(
            Guid id, UpdateTicketDTO request, ClaimsPrincipal userClaims);
        Task<bool> DeleteTicketAsync(
            Guid id, ClaimsPrincipal userClaims);
    }

    public class TicketService : ITicketService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;

        public TicketService(AppDbContext context, ITicketQueryHelper queryHelper)
        {
            _context = context;
            _queryHelper = queryHelper;
        }

        // ─── GET ALL TICKETS ──────────────────────────────────
        public async Task<PaginatedResponseDTO<TicketListResponseDTO>> GetTicketsAsync(
            TicketFilterDTO filter, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);
            var query = _queryHelper.BaseTicketQuery();

            // Role-based filtering
            // Employee sees own tickets only
            if (role == RoleConstants.Employee)
                query = query.Where(t => t.CreatedById == userId);

            // ITSupportAgent sees assigned tickets only
            else if (role == RoleConstants.ITSupportAgent)
                query = query.Where(t => t.AssignedToId == userId);

            // Manager and Admin see all tickets — no filter

            // Search filter
            if (!string.IsNullOrEmpty(filter.Search))
                query = query.Where(t =>
                    t.Title.Contains(filter.Search) ||
                    t.ReferenceNumber.Contains(filter.Search) ||
                    t.Description.Contains(filter.Search));

            // Category filter
            if (filter.CategoryId.HasValue)
                query = query.Where(t => t.CategoryId == filter.CategoryId);

            // Priority filter
            if (filter.PriorityId.HasValue)
                query = query.Where(t => t.PriorityId == filter.PriorityId);

            // Status filter
            if (filter.StatusId.HasValue)
                query = query.Where(t => t.StatusId == filter.StatusId);

            // Escalation filter
            if (filter.EscalationRequested.HasValue)
                query = query.Where(t =>
                    t.EscalationRequested == filter.EscalationRequested);

            // Count total before pagination
            var totalCount = await query.CountAsync();

            // Pagination — newest first
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
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
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

            // Employee can only see own tickets
            if (role == RoleConstants.Employee && ticket.CreatedById != userId)
                return null;

            // Agent can only see assigned tickets
            if (role == RoleConstants.ITSupportAgent && ticket.AssignedToId != userId)
                return null;

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
                ReferenceNumber = await _queryHelper.GenerateReferenceNumberAsync(),
                Title = request.Title,
                Description = request.Description,
                CategoryId = request.CategoryId,
                PriorityId = request.PriorityId,
                // All new tickets always start as Open
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

            // Reload with all includes for response
            var created = await _queryHelper.BaseTicketQuery()
                .FirstAsync(t => t.Id == ticket.Id);

            return _queryHelper.MapToResponse(created);
        }

        // ─── UPDATE TICKET ────────────────────────────────────
        public async Task<TicketResponseDTO?> UpdateTicketAsync(
            Guid id, UpdateTicketDTO request, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await _queryHelper.BaseTicketQuery()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return null;

            // ── Employee ──────────────────────────────────────
            if (role == RoleConstants.Employee)
            {
                // Own tickets only
                if (ticket.CreatedById != userId) return null;

                // Only if status is Open
                if (ticket.StatusId != SeedConstants.OpenStatusId) return null;

                // Can only update title, description, due date
                if (request.Title != null) ticket.Title = request.Title;
                if (request.Description != null) ticket.Description = request.Description;
                if (request.DueAt != null) ticket.DueAt = request.DueAt;
            }

            // ── ITSupportAgent ────────────────────────────────
            else if (role == RoleConstants.ITSupportAgent)
            {
                // Assigned tickets only
                if (ticket.AssignedToId != userId) return null;

                // Can update status
                if (request.StatusId != null)
                {
                    ticket.StatusId = request.StatusId.Value;

                    // Auto set resolved info
                    if (request.StatusId == SeedConstants.ResolvedStatusId)
                    {
                        ticket.ResolvedById = userId;
                        ticket.ResolvedAt = DateTime.UtcNow;
                    }
                }

                // Can update category and priority
                if (request.CategoryId != null)
                    ticket.CategoryId = request.CategoryId.Value;
                if (request.PriorityId != null)
                    ticket.PriorityId = request.PriorityId.Value;

                // Can request escalation
                if (request.EscalationRequested == true)
                {
                    ticket.EscalationRequested = true;
                    ticket.EscalationNote = request.EscalationNote;
                }
            }

            // ── Admin ─────────────────────────────────────────
            else if (role == RoleConstants.Admin)
            {
                // Can update everything
                if (request.Title != null) ticket.Title = request.Title;
                if (request.Description != null) ticket.Description = request.Description;
                if (request.CategoryId != null) ticket.CategoryId = request.CategoryId.Value;
                if (request.PriorityId != null) ticket.PriorityId = request.PriorityId.Value;
                if (request.DueAt != null) ticket.DueAt = request.DueAt;

                if (request.StatusId != null)
                {
                    ticket.StatusId = request.StatusId.Value;

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

                // Assign ticket — resets escalation
                if (request.AssignedToId != null)
                {
                    ticket.AssignedToId = request.AssignedToId;
                    ticket.EscalationRequested = false;
                    ticket.EscalationNote = null;
                    ticket.StatusId = SeedConstants.InProgressStatusId;
                }
            }

            // ── Manager — read only ───────────────────────────
            else if (role == RoleConstants.Manager)
            {
                return null;
            }

            // Always update these
            ticket.LastUpdatedById = userId;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updated = await _queryHelper.BaseTicketQuery()
                .FirstAsync(t => t.Id == ticket.Id);

            return _queryHelper.MapToResponse(updated);
        }

        // ─── DELETE TICKET ────────────────────────────────────
        // No hard deletes — sets status to Closed
        public async Task<bool> DeleteTicketAsync(
            Guid id, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return false;

            // Employee — own + Open tickets only
            if (role == RoleConstants.Employee)
            {
                if (ticket.CreatedById != userId) return false;
                if (ticket.StatusId != SeedConstants.OpenStatusId) return false;
            }

            // Agent and Manager — cannot delete
            else if (role == RoleConstants.ITSupportAgent ||
                     role == RoleConstants.Manager)
            {
                return false;
            }

            // Admin — can close any ticket

            // Soft delete — set to Closed
            ticket.StatusId = SeedConstants.ClosedStatusId;
            ticket.ClosedById = userId;
            ticket.ClosedAt = DateTime.UtcNow;
            ticket.LastUpdatedById = userId;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}