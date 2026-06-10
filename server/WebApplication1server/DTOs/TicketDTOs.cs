namespace WebApplication1server.DTOs
{
    // ─── Create Ticket ────────────────────────────────────────
    // Used by: Employee, ITSupportAgent, Admin
    public class CreateTicketDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public Guid PriorityId { get; set; }
        public DateTime? DueAt { get; set; }
    }

    // ─── Update Ticket ────────────────────────────────────────
    // Employee: Title, Description (own + Open only)
    // ITSupportAgent: Status, Priority, Category (assigned only)
    // Admin: everything
    public class UpdateTicketDTO
    {
        // Employee + Admin
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? DueAt { get; set; }

        // ITSupportAgent + Admin
        public Guid? CategoryId { get; set; }
        public Guid? PriorityId { get; set; }
        public Guid? StatusId { get; set; }

        // Admin only
        public Guid? AssignedToId { get; set; }

        // ITSupportAgent — request escalation
        public bool? EscalationRequested { get; set; }
        public string? EscalationNote { get; set; }
    }

    // ─── Assign Ticket ────────────────────────────────────────
    // Admin only
    public class AssignTicketDTO
    {
        public Guid AssignedToId { get; set; }
    }

    // ─── Escalation Request ───────────────────────────────────
    // ITSupportAgent only
    public class EscalationRequestDTO
    {
        public string EscalationNote { get; set; } = string.Empty;
    }

    // ─── Ticket Response (full detail) ────────────────────────
    // Used by: Ticket Detail page
    public class TicketResponseDTO
    {
        public Guid Id { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public string Priority { get; set; } = string.Empty;
        public Guid PriorityId { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid StatusId { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public Guid CreatedById { get; set; }
        public string? AssignedTo { get; set; }
        public Guid? AssignedToId { get; set; }
        public string? ResolvedBy { get; set; }
        public string? ClosedBy { get; set; }
        public bool EscalationRequested { get; set; }
        public string? EscalationNote { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ─── Ticket List Response (lighter for list view) ─────────
    // Used by: Ticket List page
    public class TicketListResponseDTO
    {
        public Guid Id { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public string? AssignedTo { get; set; }
        public bool EscalationRequested { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DueAt { get; set; }
    }

    // ─── Ticket Filter (search & filtering) ───────────────────
    // Used by: Ticket List page filters
    public class TicketFilterDTO
    {
        public string? Search { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? PriorityId { get; set; }
        public Guid? StatusId { get; set; }
        public bool? EscalationRequested { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // ─── Paginated Response ───────────────────────────────────
    public class PaginatedResponseDTO<T>
    {
        public List<T> Data { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // ─── Lookup Response (for dropdowns) ──────────────────────
    public class LookupDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}