using Microsoft.EntityFrameworkCore;
using WebApplication1server.Models;
using WebApplication1server.Helpers;

namespace WebApplication1server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Role configuration
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            });

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasOne(e => e.Role)
                      .WithMany(r => r.Users)
                      .HasForeignKey(e => e.RoleId);
                entity.HasOne(e => e.CreatedBy)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedById);
            });
            // Seed roles
                        modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = RoleConstants.AdminId,
                    Name = RoleConstants.Admin,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Role
                {
                    Id = RoleConstants.ITSupportAgentId,
                    Name = RoleConstants.ITSupportAgent,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Role
                {
                    Id = RoleConstants.EmployeeId,
                    Name = RoleConstants.Employee,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Role
                {
                    Id = RoleConstants.ManagerId,
                    Name = RoleConstants.Manager,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = Guid.Parse("b1c2d3e4-f5a6-7890-abcd-ef1234567891"),
                    FirstName = "Super",
                    LastName = "Admin",
                    Email = "admin@ids.com",
                    PasswordHash = "$2a$11$WhCUTQyT4VR9a1akl1sgXO.vjcnKTXPFhQhU4l.jFMwH2lHz1IVL2",
                    RoleId = RoleConstants.AdminId,
                    IsActive = true,
                    IsEmailVerified = true,
                    ForcePasswordChange = false,
                    CreatedById = null,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

        }
    }
}