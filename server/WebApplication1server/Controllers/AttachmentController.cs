using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1server.Services;

namespace WebApplication1server.Controllers
{
    [ApiController]
    [Route("api/attachment")]
    [Authorize]
    public class AttachmentController : ControllerBase
    {
        private readonly IAttachmentService _attachmentService;

        public AttachmentController(IAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        // ─── UPLOAD ───────────────────────────────────────────
        // Accepts multipart/form-data
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(
            IFormFile file,
            [FromQuery] Guid? ticketId,
            [FromQuery] Guid? commentId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided" });

            var (attachment, error) = await _attachmentService
                .UploadAsync(file, ticketId, commentId, User);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(attachment);
        }

        // ─── GET TICKET ATTACHMENTS ───────────────────────────
        [HttpGet("ticket/{ticketId}")]
        public async Task<IActionResult> GetTicketAttachments(Guid ticketId)
        {
            var result = await _attachmentService
                .GetTicketAttachmentsAsync(ticketId, User);
            return Ok(result);
        }

        // ─── DOWNLOAD ─────────────────────────────────────────
        // Serves file through API — not directly accessible
        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(Guid id)
        {
            var (stream, contentType, fileName) = await _attachmentService
                .DownloadAsync(id, User);

            if (stream == null)
                return NotFound(new { message = "File not found or access denied" });

            return File(stream, contentType!, fileName!);
        }

        // ─── DELETE ───────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _attachmentService.DeleteAsync(id, User);
            if (!result)
                return NotFound(new { message = "File not found or access denied" });
            return Ok(new { message = "File deleted successfully" });
        }
    }
}