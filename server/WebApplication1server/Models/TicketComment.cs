namespace WebApplication1server.Models
{
    public class TicketComment
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid AuthorId { get; set; }
        public string Content { get; set; } = string.Empty;

        // IsInternal = true → only Agent and Admin can see
        // IsInternal = false → everyone on the ticket can see
        public bool IsInternal { get; set; } = false;

        // Permanent — no UpdatedAt since comments cannot be edited
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Ticket Ticket { get; set; } = null!;
        public User Author { get; set; } = null!;
    }
}