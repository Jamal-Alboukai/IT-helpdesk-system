namespace WebApplication1server.Helpers
{
    public static class RoleConstants
    {
        // Role Names
        public const string Admin = "Admin";
        public const string ITSupportAgent = "ITSupportAgent";
        public const string Employee = "Employee";
        public const string Manager = "Manager";

        // Role IDs
        public static readonly Guid AdminId =
            Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567891");
        public static readonly Guid ITSupportAgentId =
            Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567892");
        public static readonly Guid EmployeeId =
            Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567893");
        public static readonly Guid ManagerId =
            Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567894");
    }
}