using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WebApplication1server.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        // ─── Called when client connects ──────────────────────
        public override async Task OnConnectedAsync()
        {
            // Add user to their own group using userId
            // So we can send notifications to specific users
            var userId = Context.User?.FindFirst("nameid")?.Value;
            if (userId != null)
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId, userId);
            }
            await base.OnConnectedAsync();
        }

        // ─── Called when client disconnects ───────────────────
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("nameid")?.Value;
            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId, userId);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}