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
        public DbSet<Category> Categories { get; set; }
        public DbSet<Priority> Priorities { get; set; }
        public DbSet<Status> Statuses { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ─── Role configuration ───────────────────────────
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
            });

            // ─── User configuration ───────────────────────────
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasOne(e => e.Role)
                      .WithMany(r => r.Users)
                      .HasForeignKey(e => e.RoleId);
                entity.HasOne(e => e.CreatedBy)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedById);
            });

            // ─── Category configuration ───────────────────────
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
            });

            // ─── Priority configuration ───────────────────────
            modelBuilder.Entity<Priority>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
            });

            // ─── Status configuration ─────────────────────────
            modelBuilder.Entity<Status>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
            });

            // ─── Ticket configuration ─────────────────────────
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ReferenceNumber)
                    .IsRequired()
                    .HasMaxLength(255);
                entity.HasIndex(e => e.ReferenceNumber).IsUnique();
                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(255);
                entity.Property(e => e.Description)
                    .IsRequired();

                // Relationships
                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Tickets)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Priority)
                      .WithMany(p => p.Tickets)
                      .HasForeignKey(e => e.PriorityId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Status)
                      .WithMany(s => s.Tickets)
                      .HasForeignKey(e => e.StatusId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CreatedBy)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedById)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.AssignedTo)
                      .WithMany()
                      .HasForeignKey(e => e.AssignedToId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ResolvedBy)
                      .WithMany()
                      .HasForeignKey(e => e.ResolvedById)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ClosedBy)
                      .WithMany()
                      .HasForeignKey(e => e.ClosedById)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.LastUpdatedBy)
                      .WithMany()
                      .HasForeignKey(e => e.LastUpdatedById)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ─── Seed Roles ───────────────────────────────────
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

            // ─── Seed Admin User ──────────────────────────────
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

            // ─── Seed Categories ──────────────────────────────
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = SeedConstants.HardwareCategoryId, Name = "Hardware", Description = "Hardware related issues", IsActive = true },
                new Category { Id = SeedConstants.SoftwareCategoryId, Name = "Software", Description = "Software related issues", IsActive = true },
                new Category { Id = SeedConstants.NetworkCategoryId, Name = "Network", Description = "Network related issues", IsActive = true },
                new Category { Id = SeedConstants.EmailCategoryId, Name = "Email", Description = "Email related issues", IsActive = true },
                new Category { Id = SeedConstants.AccessRequestCategoryId, Name = "Access Request", Description = "Access and permission requests", IsActive = true },
                new Category { Id = SeedConstants.OtherCategoryId, Name = "Other", Description = "Other issues", IsActive = true }
            );
            // ─── Seed Priorities ──────────────────────────────
            modelBuilder.Entity<Priority>().HasData(
                new Priority { Id = SeedConstants.LowPriorityId, Name = "Low", DisplayOrder = 1, IsActive = true },
                new Priority { Id = SeedConstants.MediumPriorityId, Name = "Medium", DisplayOrder = 2, IsActive = true },
                new Priority { Id = SeedConstants.HighPriorityId, Name = "High", DisplayOrder = 3, IsActive = true },
                new Priority { Id = SeedConstants.CriticalPriorityId, Name = "Critical", DisplayOrder = 4, IsActive = true }
            );

            // ─── Seed Statuses ────────────────────────────────
            modelBuilder.Entity<Status>().HasData(
                new Status { Id = SeedConstants.OpenStatusId, Name = "Open", DisplayOrder = 1, IsActive = true },
                new Status { Id = SeedConstants.InProgressStatusId, Name = "In Progress", DisplayOrder = 2, IsActive = true },
                new Status { Id = SeedConstants.PendingStatusId, Name = "Pending", DisplayOrder = 3, IsActive = true },
                new Status { Id = SeedConstants.ResolvedStatusId, Name = "Resolved", DisplayOrder = 4, IsActive = true },
                new Status { Id = SeedConstants.ClosedStatusId, Name = "Closed", DisplayOrder = 5, IsActive = true }
            );
            // ─── ActivityLog configuration ────────────────────────
            modelBuilder.Entity<ActivityLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action)
                    .IsRequired()
                    .HasMaxLength(255);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Ticket)
                      .WithMany()
                      .HasForeignKey(e => e.TicketId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}