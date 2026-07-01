using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1server.Data;
using WebApplication1server.Helpers;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public class AttachmentResponseDTO
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string UploadedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsImage { get; set; }
    }

    public interface IAttachmentService
    {
        Task<(AttachmentResponseDTO? attachment, string? error)> UploadAsync(
            IFormFile file,
            Guid? ticketId,
            Guid? commentId,
            ClaimsPrincipal userClaims);
        Task<List<AttachmentResponseDTO>> GetTicketAttachmentsAsync(
            Guid ticketId, ClaimsPrincipal userClaims);
        Task<(Stream? stream, string? contentType, string? fileName)>
            DownloadAsync(Guid attachmentId, ClaimsPrincipal userClaims);
        Task<bool> DeleteAsync(
            Guid attachmentId, ClaimsPrincipal userClaims);
    }

    public class AttachmentService : IAttachmentService
    {
        private readonly AppDbContext _context;
        private readonly ITicketQueryHelper _queryHelper;
        private readonly IWebHostEnvironment _environment;

        public AttachmentService(
            AppDbContext context,
            ITicketQueryHelper queryHelper,
            IWebHostEnvironment environment)
        {
            _context = context;
            _queryHelper = queryHelper;
            _environment = environment;
        }

        // ─── Helper: Get upload path ──────────────────────────
        private string GetUploadPath()
        {
            // Store outside wwwroot for security
            var uploadPath = Path.Combine(
                _environment.ContentRootPath, "uploads");
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);
            return uploadPath;
        }

        // ─── Helper: Check ticket access ──────────────────────
        private async Task<bool> HasTicketAccessAsync(
            Guid ticketId, Guid userId, string role)
        {
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket == null) return false;

            if (role == RoleConstants.Employee &&
                ticket.CreatedById != userId) return false;
            if (role == RoleConstants.ITSupportAgent &&
                ticket.AssignedToId != userId) return false;

            return true;
        }

        // ─── UPLOAD ───────────────────────────────────────────
        public async Task<(AttachmentResponseDTO? attachment, string? error)>
            UploadAsync(
                IFormFile file,
                Guid? ticketId,
                Guid? commentId,
                ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            // Must have either ticketId or commentId
            if (!ticketId.HasValue && !commentId.HasValue)
                return (null, "TicketId or CommentId is required");

            // Manager cannot upload
            if (role == RoleConstants.Manager)
                return (null, "Managers cannot upload attachments");

            // Check ticket access
            Guid accessTicketId = ticketId ?? Guid.Empty;
            if (commentId.HasValue && !ticketId.HasValue)
            {
                var comment = await _context.TicketComments
                    .FirstOrDefaultAsync(c => c.Id == commentId);
                if (comment == null) return (null, "Comment not found");
                accessTicketId = comment.TicketId;
            }

            if (!await HasTicketAccessAsync(accessTicketId, userId, role))
                return (null, "Access denied");

            // Validate file
            var (isValid, error) = FileValidationHelper.ValidateFile(file);
            if (!isValid) return (null, error);

            // Sanitize and generate stored filename
            var sanitizedName = FileValidationHelper
                .SanitizeFileName(file.FileName);
            var storedName = FileValidationHelper
                .GenerateStoredFileName(sanitizedName);
            var uploadPath = GetUploadPath();
            var filePath = Path.Combine(uploadPath, storedName);

            // Save file to disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Save to database
            var attachment = new TicketAttachment
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                CommentId = commentId,
                UploadedById = userId,
                FileName = sanitizedName,
                StoredFileName = storedName,
                FilePath = filePath,
                FileSize = file.Length,
                ContentType = file.ContentType,
                CreatedAt = DateTime.UtcNow
            };

            _context.TicketAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            // ─── Reload with includes for correct uploader name ──
            var saved = await _context.TicketAttachments
                .Include(a => a.UploadedBy)
                .FirstAsync(a => a.Id == attachment.Id);

            return (MapToResponse(saved, userId), null);
        }

        // ─── GET TICKET ATTACHMENTS ───────────────────────────
        public async Task<List<AttachmentResponseDTO>> GetTicketAttachmentsAsync(
            Guid ticketId, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            if (!await HasTicketAccessAsync(ticketId, userId, role))
                return new List<AttachmentResponseDTO>();

            var attachments = await _context.TicketAttachments
                .Include(a => a.UploadedBy)
                .Where(a => a.TicketId == ticketId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return attachments
                .Select(a => MapToResponse(a, userId))
                .ToList();
        }

        // ─── DOWNLOAD ─────────────────────────────────────────
        public async Task<(Stream? stream, string? contentType, string? fileName)>
            DownloadAsync(Guid attachmentId, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var attachment = await _context.TicketAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null) return (null, null, null);

            // Check access via ticket
            Guid? ticketId = attachment.TicketId;
            if (!ticketId.HasValue && attachment.CommentId.HasValue)
            {
                var comment = await _context.TicketComments
                    .FirstOrDefaultAsync(c => c.Id == attachment.CommentId);
                ticketId = comment?.TicketId;
            }

            if (!ticketId.HasValue ||
                !await HasTicketAccessAsync(ticketId.Value, userId, role))
                return (null, null, null);

            // Check file exists on disk
            if (!File.Exists(attachment.FilePath))
                return (null, null, null);

            var stream = new FileStream(
                attachment.FilePath,
                FileMode.Open,
                FileAccess.Read);

            return (stream, attachment.ContentType, attachment.FileName);
        }

        // ─── DELETE ───────────────────────────────────────────
        public async Task<bool> DeleteAsync(
            Guid attachmentId, ClaimsPrincipal userClaims)
        {
            var (userId, role) = _queryHelper.GetUserInfo(userClaims);

            var attachment = await _context.TicketAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null) return false;

            // Only uploader or Admin can delete
            if (role != RoleConstants.Admin &&
                attachment.UploadedById != userId)
                return false;

            // Delete file from disk
            if (File.Exists(attachment.FilePath))
                File.Delete(attachment.FilePath);

            // Delete from database
            _context.TicketAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return true;
        }

        // ─── Helper: Map to response ──────────────────────────
        private AttachmentResponseDTO MapToResponse(
            TicketAttachment attachment, Guid userId)
        {
            return new AttachmentResponseDTO
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FileSize = attachment.FileSize,
                ContentType = attachment.ContentType,
                UploadedBy = attachment.UploadedBy != null
                    ? $"{attachment.UploadedBy.FirstName} {attachment.UploadedBy.LastName}"
                    : "Unknown",
                CreatedAt = attachment.CreatedAt,
                IsImage = attachment.ContentType.StartsWith("image/")
            };
        }
    }
}