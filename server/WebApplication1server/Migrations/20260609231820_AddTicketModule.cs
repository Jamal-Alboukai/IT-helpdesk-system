using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WebApplication1server.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Priorities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Priorities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Statuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Statuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    PriorityId = table.Column<Guid>(type: "uuid", nullable: false),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedToId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolvedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ClosedById = table.Column<Guid>(type: "uuid", nullable: true),
                    LastUpdatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Priorities_PriorityId",
                        column: x => x.PriorityId,
                        principalTable: "Priorities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Statuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "Statuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_ClosedById",
                        column: x => x.ClosedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_LastUpdatedById",
                        column: x => x.LastUpdatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_ResolvedById",
                        column: x => x.ResolvedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { new Guid("c1000000-0000-0000-0000-000000000001"), "Hardware related issues", true, "Hardware" },
                    { new Guid("c1000000-0000-0000-0000-000000000002"), "Software related issues", true, "Software" },
                    { new Guid("c1000000-0000-0000-0000-000000000003"), "Network related issues", true, "Network" },
                    { new Guid("c1000000-0000-0000-0000-000000000004"), "Email related issues", true, "Email" },
                    { new Guid("c1000000-0000-0000-0000-000000000005"), "Access and permission requests", true, "Access Request" },
                    { new Guid("c1000000-0000-0000-0000-000000000006"), "Other issues", true, "Other" }
                });

            migrationBuilder.InsertData(
                table: "Priorities",
                columns: new[] { "Id", "DisplayOrder", "IsActive", "Name" },
                values: new object[,]
                {
                    { new Guid("d1000000-0000-0000-0000-000000000001"), 1, true, "Low" },
                    { new Guid("d1000000-0000-0000-0000-000000000002"), 2, true, "Medium" },
                    { new Guid("d1000000-0000-0000-0000-000000000003"), 3, true, "High" },
                    { new Guid("d1000000-0000-0000-0000-000000000004"), 4, true, "Critical" }
                });

            migrationBuilder.InsertData(
                table: "Statuses",
                columns: new[] { "Id", "DisplayOrder", "IsActive", "Name" },
                values: new object[,]
                {
                    { new Guid("e1000000-0000-0000-0000-000000000001"), 1, true, "Open" },
                    { new Guid("e1000000-0000-0000-0000-000000000002"), 2, true, "In Progress" },
                    { new Guid("e1000000-0000-0000-0000-000000000003"), 3, true, "Pending" },
                    { new Guid("e1000000-0000-0000-0000-000000000004"), 4, true, "Resolved" },
                    { new Guid("e1000000-0000-0000-0000-000000000005"), 5, true, "Closed" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AssignedToId",
                table: "Tickets",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CategoryId",
                table: "Tickets",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ClosedById",
                table: "Tickets",
                column: "ClosedById");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreatedById",
                table: "Tickets",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_LastUpdatedById",
                table: "Tickets",
                column: "LastUpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_PriorityId",
                table: "Tickets",
                column: "PriorityId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ReferenceNumber",
                table: "Tickets",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ResolvedById",
                table: "Tickets",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_StatusId",
                table: "Tickets",
                column: "StatusId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Priorities");

            migrationBuilder.DropTable(
                name: "Statuses");
        }
    }
}
