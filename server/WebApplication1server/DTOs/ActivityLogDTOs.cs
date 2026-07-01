namespace WebApplication1server.DTOs
{
    public class ActivityLogFilterDTO
    {
        public string? Search { get; set; }        // search by action or user name
        public string? Action { get; set; }        // filter by specific action
        public Guid? UserId { get; set; }          // filter by specific user
        public Guid? TicketId { get; set; }        // filter by specific ticket
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ActivityLogDetailDTO
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string PerformedBy { get; set; } = string.Empty;
        public Guid PerformedById { get; set; }
        public string PerformedByRole { get; set; } = string.Empty;
        public string? TicketReference { get; set; }
        public Guid? TicketId { get; set; }
        public string? TicketTitle { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ActivityLogPagedDTO
    {
        public List<ActivityLogDetailDTO> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // For the action filter dropdown
    public class ActionTypeDTO
    {
        public string Action { get; set; } = string.Empty;
    }
}