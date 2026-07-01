namespace WebApplication1server.DTOs
{
    public class MonthlySummaryDTO
    {
        public string Month { get; set; } = string.Empty;      // "Jan 2026"
        public int Year { get; set; }
        public int MonthNumber { get; set; }
        public int TotalCreated { get; set; }
        public int Resolved { get; set; }
        public int Closed { get; set; }
        public int Escalated { get; set; }
        public double AvgResolutionHours { get; set; }         // 0 if none resolved
    }

    public class AgentPerformanceDTO
    {
        public string AgentName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TotalAssigned { get; set; }
        public int Resolved { get; set; }
        public int Closed { get; set; }
        public int ActiveTickets { get; set; }                 // Open + InProgress + Pending
        public double AvgResolutionHours { get; set; }
        public double ResolutionRate { get; set; }             // % of assigned that are resolved/closed
    }

    public class ReportsSummaryDTO
    {
        public List<MonthlySummaryDTO> MonthlySummary { get; set; } = new();
        public List<AgentPerformanceDTO> AgentPerformance { get; set; } = new();
        public string GeneratedAt { get; set; } = string.Empty;
    }
}