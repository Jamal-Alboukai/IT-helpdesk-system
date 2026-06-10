namespace WebApplication1server.Models
{
    public class ActivityLog
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? TicketId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
        public Ticket? Ticket { get; set; }
    }
}