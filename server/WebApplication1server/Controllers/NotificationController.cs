using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/notification")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // ─── GET MY NOTIFICATIONS ─────────────────────────────
        // Returns last 50 notifications for logged in user
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var result = await _notificationService
                .GetMyNotificationsAsync(User);
            return Ok(result);
        }

        // ─── GET UNREAD COUNT ─────────────────────────────────
        // Used by frontend notification bell badge
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var count = await _notificationService
                .GetUnreadCountAsync(User);
            return Ok(new { count });
        }

        // ─── MARK AS READ ─────────────────────────────────────
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var result = await _notificationService
                .MarkAsReadAsync(id, User);
            if (!result)
                return NotFound(new { message = "Notification not found" });
            return Ok(new { message = "Notification marked as read" });
        }

        // ─── MARK ALL AS READ ─────────────────────────────────
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            await _notificationService.MarkAllAsReadAsync(User);
            return Ok(new { message = "All notifications marked as read" });
        }
    }
}