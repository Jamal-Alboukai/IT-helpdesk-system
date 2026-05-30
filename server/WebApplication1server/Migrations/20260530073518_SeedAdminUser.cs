using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication1server.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "CreatedById", "Email", "FirstName", "ForcePasswordChange", "IsActive", "IsEmailVerified", "LastName", "PasswordHash", "PasswordResetToken", "PasswordResetTokenExpiry", "RoleId", "UpdatedAt" },
                values: new object[] { new Guid("b1c2d3e4-f5a6-7890-abcd-ef1234567891"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "admin@ids.com", "Super", false, true, true, "Admin", "$2a$11$WhCUTQyT4VR9a1akl1sgXO.vjcnKTXPFhQhU4l.jFMwH2lHz1IVL2", null, null, new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567891"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("b1c2d3e4-f5a6-7890-abcd-ef1234567891"));
        }
    }
}
