namespace WebApplication1server.Helpers
{
    public static class FileValidationHelper
    {
        // ─── Allowed file types (whitelist) ───────────────────
        private static readonly Dictionary<string, string[]> AllowedTypes
            = new()
        {
            // Images
            { "image/jpeg", new[] { ".jpg", ".jpeg" } },
            { "image/png", new[] { ".png" } },
            { "image/gif", new[] { ".gif" } },
            { "image/webp", new[] { ".webp" } },
            // Documents
            { "application/pdf", new[] { ".pdf" } },
            { "application/msword", new[] { ".doc" } },
            {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new[] { ".docx" }
            },
            {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new[] { ".xlsx" }
            }
        };

        // ─── Magic bytes (file signatures) ────────────────────
        // Verifies actual file content matches claimed type
        private static readonly Dictionary<string, byte[][]> MagicBytes
            = new()
        {
            { "image/jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { "image/png", new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47 } } },
            { "image/gif", new[] {
                new byte[] { 0x47, 0x49, 0x46, 0x38, 0x37 },
                new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39 }
            }},
            { "image/webp", new[] { new byte[] { 0x52, 0x49, 0x46, 0x46 } } },
            { "application/pdf", new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } } },
            // Office documents use ZIP format magic bytes
            { "application/msword", new[] { new byte[] { 0xD0, 0xCF, 0x11, 0xE0 } } },
            {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } }
            },
            {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } }
            }
        };

        public const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB

        // ─── Validate file ────────────────────────────────────
        public static (bool isValid, string error) ValidateFile(
            IFormFile file)
        {
            // Check file size
            if (file.Length == 0)
                return (false, "File is empty");

            if (file.Length > MaxFileSizeBytes)
                return (false, "File size exceeds 5MB limit");

            // Check content type is in whitelist
            if (!AllowedTypes.ContainsKey(file.ContentType.ToLower()))
                return (false,
                    "File type not allowed. Allowed: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLSX");

            // Check file extension matches content type
            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = AllowedTypes[file.ContentType.ToLower()];
            if (!allowedExtensions.Contains(extension))
                return (false, "File extension does not match file type");

            // Validate magic bytes
            using var stream = file.OpenReadStream();
            var magicBytesValid = ValidateMagicBytes(
                stream, file.ContentType.ToLower());
            if (!magicBytesValid)
                return (false, "File content does not match claimed type");

            return (true, string.Empty);
        }

        // ─── Validate magic bytes ─────────────────────────────
        private static bool ValidateMagicBytes(
            Stream stream, string contentType)
        {
            if (!MagicBytes.ContainsKey(contentType))
                return true; // No magic bytes defined — skip check

            var signatures = MagicBytes[contentType];
            var maxLength = signatures.Max(s => s.Length);
            var buffer = new byte[maxLength];

            stream.Position = 0;
            var bytesRead = stream.Read(buffer, 0, maxLength);
            stream.Position = 0;

            if (bytesRead < maxLength) return false;

            return signatures.Any(signature =>
                buffer.Take(signature.Length)
                    .SequenceEqual(signature));
        }

        // ─── Sanitize file name ───────────────────────────────
        public static string SanitizeFileName(string fileName)
        {
            // Remove path traversal characters
            fileName = Path.GetFileName(fileName);

            // Remove invalid characters
            var invalidChars = Path.GetInvalidFileNameChars();
            fileName = string.Concat(fileName
                .Where(c => !invalidChars.Contains(c)));

            // Limit length
            var nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            var ext = Path.GetExtension(fileName);
            if (nameWithoutExt.Length > 100)
                nameWithoutExt = nameWithoutExt[..100];

            return $"{nameWithoutExt}{ext}";
        }

        // ─── Generate stored file name ────────────────────────
        // Uses GUID to prevent filename collisions and guessing
        public static string GenerateStoredFileName(string originalFileName)
        {
            var ext = Path.GetExtension(originalFileName).ToLower();
            return $"{Guid.NewGuid()}{ext}";
        }
    }
}