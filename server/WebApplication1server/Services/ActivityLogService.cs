using WebApplication1server.Data;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public interface IActivityLogService
    {
        Task LogAsync(
            Guid userId,
            string action,
            Guid? ticketId = null,
            string? oldValue = null,
            string? newValue = null);
    }

    public class ActivityLogService : IActivityLogService
    {
        private readonly AppDbContext _context;

        public ActivityLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            Guid userId,
            string action,
            Guid? ticketId = null,
            string? oldValue = null,
            string? newValue = null)
        {
            var log = new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TicketId = ticketId,
                Action = action,
                OldValue = oldValue,
                NewValue = newValue,
                CreatedAt = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}