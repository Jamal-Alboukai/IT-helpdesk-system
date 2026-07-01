using Microsoft.EntityFrameworkCore;
using WebApplication1server.Data;
using WebApplication1server.DTOs;
using WebApplication1server.Models;

namespace WebApplication1server.Services
{
    public interface ISettingsService
    {
        // ─── Categories ───────────────────────────────────────
        Task<List<CategoryDetailDTO>> GetAllCategoriesAsync();
        Task<(CategoryDetailDTO? result, string? error)> CreateCategoryAsync(
            CreateCategoryDTO request);
        Task<(CategoryDetailDTO? result, string? error)> UpdateCategoryAsync(
            Guid id, UpdateCategoryDTO request);

        // ─── Priorities ───────────────────────────────────────
        Task<List<PriorityDetailDTO>> GetAllPrioritiesAsync();
        Task<(PriorityDetailDTO? result, string? error)> CreatePriorityAsync(
            CreatePriorityDTO request);
        Task<(PriorityDetailDTO? result, string? error)> UpdatePriorityAsync(
            Guid id, UpdatePriorityDTO request);

        // ─── Statuses (read only) ─────────────────────────────
        Task<List<StatusDetailDTO>> GetAllStatusesAsync();
    }

    public class SettingsService : ISettingsService
    {
        private readonly AppDbContext _context;

        public SettingsService(AppDbContext context)
        {
            _context = context;
        }

        // ─── CATEGORIES ───────────────────────────────────────

        // Returns ALL categories including inactive — for admin view
        public async Task<List<CategoryDetailDTO>> GetAllCategoriesAsync()
        {
            return await _context.Categories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDetailDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive
                })
                .ToListAsync();
        }

        public async Task<(CategoryDetailDTO? result, string? error)>
            CreateCategoryAsync(CreateCategoryDTO request)
        {
            // Prevent duplicate names (case-insensitive)
            var exists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == request.Name.ToLower());

            if (exists)
                return (null, $"Category '{request.Name}' already exists.");

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                IsActive = true
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return (new CategoryDetailDTO
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                IsActive = category.IsActive
            }, null);
        }

        public async Task<(CategoryDetailDTO? result, string? error)>
            UpdateCategoryAsync(Guid id, UpdateCategoryDTO request)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return (null, "Category not found.");

            // Check for duplicate name if name is being changed
            if (request.Name != null &&
                !string.Equals(request.Name, category.Name,
                    StringComparison.OrdinalIgnoreCase))
            {
                var exists = await _context.Categories
                    .AnyAsync(c => c.Name.ToLower() == request.Name.ToLower()
                        && c.Id != id);

                if (exists)
                    return (null, $"Category '{request.Name}' already exists.");

                category.Name = request.Name.Trim();
            }

            if (request.Description != null)
                category.Description = request.Description.Trim();

            if (request.IsActive.HasValue)
                category.IsActive = request.IsActive.Value;

            await _context.SaveChangesAsync();

            return (new CategoryDetailDTO
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                IsActive = category.IsActive
            }, null);
        }

        // ─── PRIORITIES ───────────────────────────────────────

        public async Task<List<PriorityDetailDTO>> GetAllPrioritiesAsync()
        {
            return await _context.Priorities
                .OrderBy(p => p.DisplayOrder)
                .Select(p => new PriorityDetailDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    DisplayOrder = p.DisplayOrder,
                    IsActive = p.IsActive
                })
                .ToListAsync();
        }

        public async Task<(PriorityDetailDTO? result, string? error)>
            CreatePriorityAsync(CreatePriorityDTO request)
        {
            var exists = await _context.Priorities
                .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower());

            if (exists)
                return (null, $"Priority '{request.Name}' already exists.");

            var priority = new Priority
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                DisplayOrder = request.DisplayOrder,
                IsActive = true
            };

            _context.Priorities.Add(priority);
            await _context.SaveChangesAsync();

            return (new PriorityDetailDTO
            {
                Id = priority.Id,
                Name = priority.Name,
                DisplayOrder = priority.DisplayOrder,
                IsActive = priority.IsActive
            }, null);
        }

        public async Task<(PriorityDetailDTO? result, string? error)>
            UpdatePriorityAsync(Guid id, UpdatePriorityDTO request)
        {
            var priority = await _context.Priorities
                .FirstOrDefaultAsync(p => p.Id == id);

            if (priority == null)
                return (null, "Priority not found.");

            if (request.Name != null &&
                !string.Equals(request.Name, priority.Name,
                    StringComparison.OrdinalIgnoreCase))
            {
                var exists = await _context.Priorities
                    .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower()
                        && p.Id != id);

                if (exists)
                    return (null, $"Priority '{request.Name}' already exists.");

                priority.Name = request.Name.Trim();
            }

            if (request.DisplayOrder.HasValue)
                priority.DisplayOrder = request.DisplayOrder.Value;

            if (request.IsActive.HasValue)
                priority.IsActive = request.IsActive.Value;

            await _context.SaveChangesAsync();

            return (new PriorityDetailDTO
            {
                Id = priority.Id,
                Name = priority.Name,
                DisplayOrder = priority.DisplayOrder,
                IsActive = priority.IsActive
            }, null);
        }

        // ─── STATUSES (read only) ─────────────────────────────

        public async Task<List<StatusDetailDTO>> GetAllStatusesAsync()
        {
            return await _context.Statuses
                .OrderBy(s => s.DisplayOrder)
                .Select(s => new StatusDetailDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    DisplayOrder = s.DisplayOrder,
                    IsActive = s.IsActive
                })
                .ToListAsync();
        }
    }
}