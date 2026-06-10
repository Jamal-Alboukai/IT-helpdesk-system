namespace WebApplication1server.Helpers
{
    public class SeedConstants
    {
        // Categories
        public static readonly Guid HardwareCategoryId = Guid.Parse("c1000000-0000-0000-0000-000000000001");
        public static readonly Guid SoftwareCategoryId = Guid.Parse("c1000000-0000-0000-0000-000000000002");
        public static readonly Guid NetworkCategoryId = Guid.Parse("c1000000-0000-0000-0000-000000000003");
        public static readonly Guid EmailCategoryId = Guid.Parse("c1000000-0000-0000-0000-000000000004");
        public static readonly Guid AccessRequestCategoryId = Guid.Parse("c1000000-0000-0000-0000-000000000005");
        public static readonly Guid OtherCategoryId = Guid.Parse("c1000000-0000-0000-0000-000000000006");

        // Priorities
        public static readonly Guid LowPriorityId = Guid.Parse("d1000000-0000-0000-0000-000000000001");
        public static readonly Guid MediumPriorityId = Guid.Parse("d1000000-0000-0000-0000-000000000002");
        public static readonly Guid HighPriorityId = Guid.Parse("d1000000-0000-0000-0000-000000000003");
        public static readonly Guid CriticalPriorityId = Guid.Parse("d1000000-0000-0000-0000-000000000004");

        // Statuses
        public static readonly Guid OpenStatusId = Guid.Parse("e1000000-0000-0000-0000-000000000001");
        public static readonly Guid InProgressStatusId = Guid.Parse("e1000000-0000-0000-0000-000000000002");
        public static readonly Guid PendingStatusId = Guid.Parse("e1000000-0000-0000-0000-000000000003");
        public static readonly Guid ResolvedStatusId = Guid.Parse("e1000000-0000-0000-0000-000000000004");
        public static readonly Guid ClosedStatusId = Guid.Parse("e1000000-0000-0000-0000-000000000005");

    }
}
