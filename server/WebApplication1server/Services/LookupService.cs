using Microsoft.EntityFrameworkCore;
using WebApplication1server.Data;
using WebApplication1server.DTOs;

namespace WebApplication1server.Services
{
    public interface ILookupService
    {
        Task<List<LookupDTO>> GetCategoriesAsync();
        Task<List<LookupDTO>> GetPrioritiesAsync();
        Task<List<LookupDTO>> GetStatusesAsync();
    }

    public class LookupService : ILookupService
    {
        private readonly AppDbContext _context;

        public LookupService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<LookupDTO>> GetCategoriesAsync()
        {
            return await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new LookupDTO { Id = c.Id, Name = c.Name })
                .ToListAsync();
        }

        public async Task<List<LookupDTO>> GetPrioritiesAsync()
        {
            return await _context.Priorities
                .Where(p => p.IsActive)
                .OrderBy(p => p.DisplayOrder)
                .Select(p => new LookupDTO { Id = p.Id, Name = p.Name })
                .ToListAsync();
        }

        public async Task<List<LookupDTO>> GetStatusesAsync()
        {
            return await _context.Statuses
                .Where(s => s.IsActive)
                .OrderBy(s => s.DisplayOrder)
                .Select(s => new LookupDTO { Id = s.Id, Name = s.Name })
                .ToListAsync();
        }
    }
}