using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication1server.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketModuleV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EscalationNote",
                table: "Tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EscalationRequested",
                table: "Tickets",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EscalationNote",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "EscalationRequested",
                table: "Tickets");
        }
    }
}
