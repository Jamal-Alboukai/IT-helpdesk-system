using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Models;

namespace WebApplication1server.Helpers
{
    public interface ITicketQueryHelper
    {
        (Guid userId, string role) GetUserInfo(ClaimsPrincipal userClaims);
        IQueryable<Ticket> BaseTicketQuery();
        TicketResponseDTO MapToResponse(Ticket ticket);
        Task<string> GenerateReferenceNumberAsync();
    }

    public class TicketQueryHelper : ITicketQueryHelper
    {
        private readonly AppDbContext _context;

        public TicketQueryHelper(AppDbContext context)
        {
            _context = context;
        }

        public (Guid userId, string role) GetUserInfo(ClaimsPrincipal userClaims)
        {
            var userId = Guid.Parse(userClaims.FindFirst("nameid")!.Value);
            var role = userClaims.FindFirst(ClaimTypes.Role)!.Value;
            return (userId, role);
        }

        public IQueryable<Ticket> BaseTicketQuery()
        {
            return _context.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.ResolvedBy)
                .Include(t => t.ClosedBy);
        }

        public TicketResponseDTO MapToResponse(Ticket ticket)
        {
            return new TicketResponseDTO
            {
                Id = ticket.Id,
                ReferenceNumber = ticket.ReferenceNumber,
                Title = ticket.Title,
                Description = ticket.Description,
                Category = ticket.Category.Name,
                CategoryId = ticket.CategoryId,
                Priority = ticket.Priority.Name,
                PriorityId = ticket.PriorityId,
                Status = ticket.Status.Name,
                StatusId = ticket.StatusId,
                CreatedBy = $"{ticket.CreatedBy.FirstName} {ticket.CreatedBy.LastName}",
                CreatedById = ticket.CreatedById,
                AssignedTo = ticket.AssignedTo != null
                    ? $"{ticket.AssignedTo.FirstName} {ticket.AssignedTo.LastName}"
                    : null,
                AssignedToId = ticket.AssignedToId,
                ResolvedBy = ticket.ResolvedBy != null
                    ? $"{ticket.ResolvedBy.FirstName} {ticket.ResolvedBy.LastName}"
                    : null,
                ClosedBy = ticket.ClosedBy != null
                    ? $"{ticket.ClosedBy.FirstName} {ticket.ClosedBy.LastName}"
                    : null,
                EscalationRequested = ticket.EscalationRequested,
                EscalationNote = ticket.EscalationNote,
                DueAt = ticket.DueAt,
                ResolvedAt = ticket.ResolvedAt,
                ClosedAt = ticket.ClosedAt,
                CreatedAt = ticket.CreatedAt,
                UpdatedAt = ticket.UpdatedAt
            };
        }

        public async Task<string> GenerateReferenceNumberAsync()
        {
            var count = await _context.Tickets.CountAsync();
            return $"TKT-{(count + 1):D4}";
        }
    }
}