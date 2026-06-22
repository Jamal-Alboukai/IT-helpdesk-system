using SendGrid;
using SendGrid.Helpers.Mail;

namespace WebApplication1server.Services
{
    public interface IEmailService
    {
        Task SendTicketResolvedEmailAsync(
            string toEmail, string toName,
            string ticketReference, string ticketTitle);

        Task SendTicketAssignedEmailAsync(
            string toEmail, string toName,
            string ticketReference, string ticketTitle);

        Task SendPasswordChangedEmailAsync(
            string toEmail, string toName);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        // ─── Helper: Send email ───────────────────────────────
        private async Task SendEmailAsync(
            string toEmail,
            string toName,
            string subject,
            string htmlContent)
        {
            try
            {
                var apiKey = _configuration["SendGrid:ApiKey"];
                var fromEmail = _configuration["SendGrid:FromEmail"];
                var fromName = _configuration["SendGrid:FromName"];

                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(fromEmail, fromName);
                var to = new EmailAddress(toEmail, toName);

                var msg = MailHelper.CreateSingleEmail(
                    from, to, subject, null, htmlContent);

                var response = await client.SendEmailAsync(msg);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "SendGrid failed: {StatusCode}",
                        response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                // Log but don't throw — email failure should not
                // break the main operation
                _logger.LogError(ex, "Email sending failed");
            }
        }

        // ─── Ticket Resolved Email ────────────────────────────
        public async Task SendTicketResolvedEmailAsync(
            string toEmail, string toName,
            string ticketReference, string ticketTitle)
        {
            var subject = $"Your ticket {ticketReference} has been resolved";
            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px;'>
                    <div style='background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 20px;'>
                            IDS Help Desk
                        </h1>
                    </div>
                    <div style='background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;'>
                        <h2 style='color: #1e293b;'>Ticket Resolved ✓</h2>
                        <p style='color: #475569;'>Dear {toName},</p>
                        <p style='color: #475569;'>
                            Your support ticket has been resolved by our IT team.
                        </p>
                        <div style='background: white; padding: 16px; border-radius: 8px; 
                            border-left: 4px solid #22c55e; margin: 16px 0;'>
                            <p style='margin: 0; color: #64748b; font-size: 12px;'>
                                TICKET REFERENCE
                            </p>
                            <p style='margin: 4px 0 0; color: #1e293b; font-weight: bold;'>
                                {ticketReference}
                            </p>
                            <p style='margin: 8px 0 0; color: #64748b; font-size: 12px;'>
                                ISSUE
                            </p>
                            <p style='margin: 4px 0 0; color: #1e293b;'>{ticketTitle}</p>
                        </div>
                        <p style='color: #475569;'>
                            If you are satisfied with the resolution, please log in to 
                            close the ticket. If the issue persists, you can reopen it.
                        </p>
                        <p style='color: #94a3b8; font-size: 12px; margin-top: 24px;'>
                            This is an automated message from IDS Help Desk.
                        </p>
                    </div>
                </div>";

            await SendEmailAsync(toEmail, toName, subject, html);
        }

        // ─── Ticket Assigned Email ────────────────────────────
        public async Task SendTicketAssignedEmailAsync(
            string toEmail, string toName,
            string ticketReference, string ticketTitle)
        {
            var subject = $"New ticket assigned to you: {ticketReference}";
            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px;'>
                    <div style='background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 20px;'>
                            IDS Help Desk
                        </h1>
                    </div>
                    <div style='background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;'>
                        <h2 style='color: #1e293b;'>New Ticket Assigned</h2>
                        <p style='color: #475569;'>Dear {toName},</p>
                        <p style='color: #475569;'>
                            A new support ticket has been assigned to you.
                        </p>
                        <div style='background: white; padding: 16px; border-radius: 8px;
                            border-left: 4px solid #3b82f6; margin: 16px 0;'>
                            <p style='margin: 0; color: #64748b; font-size: 12px;'>
                                TICKET REFERENCE
                            </p>
                            <p style='margin: 4px 0 0; color: #1e293b; font-weight: bold;'>
                                {ticketReference}
                            </p>
                            <p style='margin: 8px 0 0; color: #64748b; font-size: 12px;'>
                                ISSUE
                            </p>
                            <p style='margin: 4px 0 0; color: #1e293b;'>{ticketTitle}</p>
                        </div>
                        <p style='color: #475569;'>
                            Please log in to the help desk system to review 
                            and action this ticket.
                        </p>
                        <p style='color: #94a3b8; font-size: 12px; margin-top: 24px;'>
                            This is an automated message from IDS Help Desk.
                        </p>
                    </div>
                </div>";

            await SendEmailAsync(toEmail, toName, subject, html);
        }

        // ─── Password Changed Email ───────────────────────────
        public async Task SendPasswordChangedEmailAsync(
            string toEmail, string toName)
        {
            var subject = "Your IDS Help Desk password has been changed";
            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px;'>
                    <div style='background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 20px;'>
                            IDS Help Desk
                        </h1>
                    </div>
                    <div style='background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;'>
                        <h2 style='color: #1e293b;'>Password Changed</h2>
                        <p style='color: #475569;'>Dear {toName},</p>
                        <p style='color: #475569;'>
                            Your IDS Help Desk account password was recently changed.
                        </p>
                        <p style='color: #475569;'>
                            If you did not make this change, please contact your 
                            system administrator immediately.
                        </p>
                        <p style='color: #94a3b8; font-size: 12px; margin-top: 24px;'>
                            This is an automated message from IDS Help Desk.
                        </p>
                    </div>
                </div>";

            await SendEmailAsync(toEmail, toName, subject, html);
        }
    }
}