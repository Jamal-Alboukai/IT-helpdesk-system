namespace WebApplication1server.Models
{
    public class TicketAttachment
    {
        public Guid Id { get; set; }
        public Guid? TicketId { get; set; }
        public Guid? CommentId { get; set; }
        public Guid UploadedById { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string StoredFileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Ticket? Ticket { get; set; }
        public TicketComment? Comment { get; set; }
        public User UploadedBy { get; set; } = null!;
    }
}