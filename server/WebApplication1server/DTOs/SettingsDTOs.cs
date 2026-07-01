namespace WebApplication1server.DTOs
{
    // ─── Category ─────────────────────────────────────────────

    public class CategoryDetailDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCategoryDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateCategoryDTO
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }

    // ─── Priority ─────────────────────────────────────────────

    public class PriorityDetailDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreatePriorityDTO
    {
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }

    public class UpdatePriorityDTO
    {
        public string? Name { get; set; }
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }
    }

    // ─── Status (view only — workflow is fixed) ───────────────

    public class StatusDetailDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }
}