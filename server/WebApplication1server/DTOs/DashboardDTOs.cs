namespace WebApplication1server.DTOs
{
    public class DashboardStatsDTO
    {
        // ─── KPI Cards ────────────────────────────────────────
        public int TotalTickets { get; set; }
        public int OpenTickets { get; set; }
        public int InProgressTickets { get; set; }
        public int PendingTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public int ClosedTickets { get; set; }
        public int CriticalTickets { get; set; }
        public int EscalatedTickets { get; set; }

        // ─── Charts ───────────────────────────────────────────
        public List<ChartDataDTO> TicketsByCategory { get; set; } = new();
        public List<ChartDataDTO> TicketsByPriority { get; set; } = new();
        public List<ChartDataDTO> TicketsByStatus { get; set; } = new();
        public List<TimeSeriesDTO> TicketsOverTime { get; set; } = new();
    }

    public class ChartDataDTO
    {
        public string Label { get; set; } = string.Empty;
        public int Value { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class TimeSeriesDTO
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}