using System.Net.Sockets;

namespace WebApplication1server.Models
{
    public class Category
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}