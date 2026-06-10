namespace WebApplication1server.Models
{
    public class Ticket
    {
        public Guid Id { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public Guid PriorityId { get; set; }
        public Guid StatusId { get; set; }
        public Guid CreatedById { get; set; }
        public Guid? AssignedToId { get; set; }
        public Guid? ResolvedById { get; set; }
        public Guid? ClosedById { get; set; }
        public Guid LastUpdatedById { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Category Category { get; set; } = null!;
        public Priority Priority { get; set; } = null!;
        public Status Status { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public User? AssignedTo { get; set; }
        public User? ResolvedBy { get; set; }
        public User? ClosedBy { get; set; }
        public User LastUpdatedBy { get; set; } = null!;
        public bool EscalationRequested { get; set; } = false;
        public string? EscalationNote { get; set; }

    }
}