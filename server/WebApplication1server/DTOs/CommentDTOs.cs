namespace WebApplication1server.DTOs
{
    // ─── Create Comment ───────────────────────────────────────
    // Employee: public comments on own tickets only
    // ITSupportAgent: public + internal on assigned tickets
    // Admin: public + internal on any ticket
    public class CreateCommentDTO
    {
        public string Content { get; set; } = string.Empty;
        public bool IsInternal { get; set; } = false;
    }

    // ─── Comment Response ─────────────────────────────────────
    public class CommentResponseDTO
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsInternal { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public Guid AuthorId { get; set; }
        public string AuthorRole { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // ─── Activity Log Response ────────────────────────────────
    public class ActivityLogResponseDTO
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string PerformedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}