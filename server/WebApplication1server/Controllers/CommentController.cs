using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.DTOs;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/ticket/{ticketId}/comment")]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        // ─── GET COMMENTS ─────────────────────────────────────
        // Employee: public comments on own ticket
        // Agent: public + internal on assigned ticket
        // Manager: public comments on all tickets
        // Admin: public + internal on all tickets
        [HttpGet]
        public async Task<IActionResult> GetComments(Guid ticketId)
        {
            var result = await _commentService
                .GetCommentsAsync(ticketId, User);
            return Ok(result);
        }

        // ─── ADD COMMENT ──────────────────────────────────────
        // Employee: public only on own ticket
        // Agent: public + internal on assigned ticket
        // Admin: public + internal on any ticket
        // Manager: cannot comment
        [HttpPost]
        public async Task<IActionResult> AddComment(
            Guid ticketId, [FromBody] CreateCommentDTO request)
        {
            // Validate
            if (string.IsNullOrEmpty(request.Content))
                return BadRequest(new { message = "Comment content is required" });

            var result = await _commentService
                .AddCommentAsync(ticketId, request, User);

            if (result == null)
                return NotFound(new
                {
                    message = "Ticket not found, access denied, or ticket is closed"
                });

            return CreatedAtAction(nameof(GetComments),
                new { ticketId }, result);
        }

        // ─── GET TICKET HISTORY ───────────────────────────────
        // Full audit trail — all roles can see
        // Employee: own ticket history only
        // Agent: assigned ticket history only
        // Manager + Admin: all tickets
        [HttpGet("/api/ticket/{ticketId}/history")]
        public async Task<IActionResult> GetTicketHistory(Guid ticketId)
        {
            var result = await _commentService
                .GetTicketHistoryAsync(ticketId, User);
            return Ok(result);
        }
    }
}