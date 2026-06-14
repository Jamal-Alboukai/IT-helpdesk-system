namespace WebApplication1server.Helpers
{
    public static class StatusTransitionHelper
    {
        // Valid transitions
        // Key = current status ID
        // Value = allowed next status IDs
        private static readonly Dictionary<Guid, List<Guid>> AllowedTransitions
            = new()
        {
            // Open → In Progress only (happens on assignment)
            {
                SeedConstants.OpenStatusId,
                new List<Guid> { SeedConstants.InProgressStatusId }
            },
            // In Progress → Pending or Resolved
            {
                SeedConstants.InProgressStatusId,
                new List<Guid>
                {
                    SeedConstants.PendingStatusId,
                    SeedConstants.ResolvedStatusId
                }
            },
            // Pending → In Progress (employee responded)
            {
                SeedConstants.PendingStatusId,
                new List<Guid> { SeedConstants.InProgressStatusId }
            },
            // Resolved → Closed or back to In Progress
            {
                SeedConstants.ResolvedStatusId,
                new List<Guid>
                {
                    SeedConstants.ClosedStatusId,
                    SeedConstants.InProgressStatusId
                }
            },
            // Closed → nothing (final state)
            {
                SeedConstants.ClosedStatusId,
                new List<Guid>()
            }
        };

        public static bool IsValidTransition(
            Guid currentStatusId, Guid newStatusId)
        {
            // Same status — no change needed
            if (currentStatusId == newStatusId) return false;

            if (AllowedTransitions.TryGetValue(
                currentStatusId, out var allowed))
                return allowed.Contains(newStatusId);

            return false;
        }

        public static List<Guid> GetAllowedNextStatuses(Guid currentStatusId)
        {
            if (AllowedTransitions.TryGetValue(
                currentStatusId, out var allowed))
                return allowed;
            return new List<Guid>();
        }
    }
}