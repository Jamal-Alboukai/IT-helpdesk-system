using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.DTOs;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All endpoints require authentication
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;
        private readonly ITicketAssignService _ticketAssignService;
        private readonly ILookupService _lookupService;

        public TicketController(
            ITicketService ticketService,
            ITicketAssignService ticketAssignService,
            ILookupService lookupService)
        {
            _ticketService = ticketService;
            _ticketAssignService = ticketAssignService;
            _lookupService = lookupService;
        }

        // ─── GET ALL TICKETS ──────────────────────────────────
        // Employee: own tickets
        // ITSupportAgent: assigned tickets
        // Manager + Admin: all tickets
        [HttpGet]
        public async Task<IActionResult> GetTickets([FromQuery] TicketFilterDTO filter)
        {
            var result = await _ticketService.GetTicketsAsync(filter, User);
            return Ok(result);
        }

        // ─── GET TICKET BY ID ─────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTicketById(Guid id)
        {
            var result = await _ticketService.GetTicketByIdAsync(id, User);
            if (result == null)
                return NotFound(new { message = "Ticket not found or access denied" });
            return Ok(result);
        }

        // ─── CREATE TICKET ────────────────────────────────────
        // Employee, ITSupportAgent, Admin can create
        // Manager cannot create tickets
        [HttpPost]
        [Authorize(Roles = "Employee,ITSupportAgent,Admin")]
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketDTO request)
        {
            // Validate required fields
            if (string.IsNullOrEmpty(request.Title))
                return BadRequest(new { message = "Title is required" });
            if (string.IsNullOrEmpty(request.Description))
                return BadRequest(new { message = "Description is required" });
            if (request.CategoryId == Guid.Empty)
                return BadRequest(new { message = "Category is required" });
            if (request.PriorityId == Guid.Empty)
                return BadRequest(new { message = "Priority is required" });

            var result = await _ticketService.CreateTicketAsync(request, User);
            return CreatedAtAction(nameof(GetTicketById),
                new { id = result.Id }, result);
        }

        // ─── UPDATE TICKET ────────────────────────────────────
        // Rules enforced inside service per role
        [HttpPut("{id}")]
       
        public async Task<IActionResult> UpdateTicket(
            Guid id, [FromBody] UpdateTicketDTO request)
                {
                    var (result, error) = await _ticketService
                        .UpdateTicketAsync(id, request, User);

                    if (error != null)
                        return BadRequest(new { message = error });

                    if (result == null)
                        return NotFound(new { message = "Ticket not found or access denied" });

                    return Ok(result);
                }

        // ─── DELETE TICKET ────────────────────────────────────
        // Employee: own + Open only
        // Admin: any ticket
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTicket(Guid id)
        {
            var result = await _ticketService.DeleteTicketAsync(id, User);
            if (!result)
                return NotFound(new { message = "Ticket not found or access denied" });
            return Ok(new { message = "Ticket closed successfully" });
        }

        // ─── ASSIGN TICKET ────────────────────────────────────
        // Admin only
        [HttpPost("{id}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignTicket(
            Guid id, [FromBody] AssignTicketDTO request)
        {
            if (request.AssignedToId == Guid.Empty)
                return BadRequest(new { message = "AssignedToId is required" });

            var result = await _ticketAssignService.AssignTicketAsync(id, request, User);
            if (result == null)
                return NotFound(new { message = "Ticket not found or user is not an IT Support Agent" });
            return Ok(result);
        }

        // ─── REQUEST ESCALATION ───────────────────────────────
        // ITSupportAgent only
        [HttpPost("{id}/escalate")]
        [Authorize(Roles = "ITSupportAgent")]
        public async Task<IActionResult> RequestEscalation(
            Guid id, [FromBody] EscalationRequestDTO request)
        {
            if (string.IsNullOrEmpty(request.EscalationNote))
                return BadRequest(new { message = "Escalation note is required" });

            var result = await _ticketAssignService
                .RequestEscalationAsync(id, request, User);
            if (result == null)
                return NotFound(new { message = "Ticket not found or access denied" });
            return Ok(result);
        }

        // ─── LOOKUP ENDPOINTS ─────────────────────────────────
        // Used by frontend dropdowns

        [HttpGet("/api/categories")]
        public async Task<IActionResult> GetCategories()
        {
            var result = await _lookupService.GetCategoriesAsync();
            return Ok(result);
        }

        [HttpGet("/api/priorities")]
        public async Task<IActionResult> GetPriorities()
        {
            var result = await _lookupService.GetPrioritiesAsync();
            return Ok(result);
        }

        [HttpGet("/api/statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var result = await _lookupService.GetStatusesAsync();
            return Ok(result);
        }
    }
}