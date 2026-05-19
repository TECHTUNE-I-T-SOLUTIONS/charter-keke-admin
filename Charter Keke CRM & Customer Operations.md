Charter Keke CRM & Customer Operations Enhancement
Documentation
I made my findings and came up with this draft, pardon the length but I think it’s better for it to be
more detailed as well. So, as Charter Keke will continue to grow operationally and technologically,
it becomes increasingly important to establish a structured, scalable, and professional customer
support infrastructure capable of handling:
• Customer complaints
• Rider-related issues
• Payment disputes
• Technical support
• Internal escalations
• Department collaboration
• Real-time communication
• Email-based support workflows as well.
The current support implementation already includes “real-time in-app” communication between
customers and administrators like I mentioned yesterday. However, the next phase of enhancement
is focused on transforming the support infrastructure into a complete Customer Relationship
Management (CRM) and Customer Operations System capable of supporting long-term scale,
operational efficiency, and professional customer experience management.
This enhancement will allow Charter Keke to operate similarly to modern technology-enabled
logistics and mobility companies by integrating:
• Ticket-based customer support
• Departmental workflow systems
• Automated email handling
• Role-based administration
• Internal communication systems
• Knowledge base/help center systems
• Mobile app support communication
• Real-time support escalation workflows
The Vision of the CRM System
The proposed CRM architecture is not just a messaging system. Like Damzy said, it is intended to
become: A centralized customer operations management system for Charter Keke.
The system will allow support agents, operations staff, finance teams, technical administrators,
and management to collaborate efficiently while maintaining organized customer communication
channels.
The CRM system will function similarly to a lightweight hybrid of:
• Gmail,
• Slack,
• Zendesk, and
• Internal operational dashboards
While it remains fully customized for Charter Keke’s operational structure.
The Core Objective of the Enhancement
The enhancement mainly aims to achieve the following:
1. Centralized Customer Support
All customer support interactions should be managed from one centralized system regardless of
where the message originates from.
Support requests may come from:
• Mobile app chats,
• Email messages,
• Web platform support forms, and or
• Future integrations such as WhatsApp (which we’ll eventually add later as well)
All of these should eventually route into the same CRM workflow.
2. Structured Ticket Management
Every customer issue should become a properly trackable support ticket with:
• Ticket ID
• Customer information
• Department assignment
• Assigned support agent
• Status tracking
• Priority level
• Message history
• Attachments
• Internal notes
• Resolution history
This structuring makes customer operations even more measurable, searchable, organized, and
scalable.
3. Department-Based Workflow Management
Different departments should be able to collaborate internally on issues without exposing internal
discussions to customers.
Examples of the departments include:
• Customer Support,
• Rider Management,
• Finance,
• Trust & Safety,
• Technical Support,
• Operations,
• Admin Management as well by Super-Admins.
Support agents should be able to:
• Assign tickets to departments,
• Escalate issues internally,
• Delegate responsibilities,
• Add internal notes, and even
• Request investigations, cos we’ll be needing auditing too, soon enough.
4. Automated Email Support Integration
One of the most important enhancements is the integration of professional email-based support
systems.
And this requires:
• Purchasing a domain,
• Configuring official support emails,
• Setting up mail server integrations,
• Creating automated ticketing workflows. (all these are devops engineering)
Example support emails we can use/have:
support@charterkeke.com
billing@charterkeke.com
safety@charterkeke.com
operations@charterkeke.com
Domain & Professional Email Infrastructure
To establish professional support communication, Charter Keke will require a dedicated domain.
For example, like I mentioned above; charterkeke.com
Once the domain is acquired, professional email addresses can then be created.
These emails improve our:
• Brand trust
• Customer confidence
• Operational professionalism
• Automated workflow integration as well,
Email Workflow Architecture
The email support workflow will operate like these:
Step 1 — Customer Sends Email
A customer sends a message to:
support@charterkeke.com
Example:
Subject: My rider billed me more when we got to my destination
Message:
My rider billed me more when we got to my destination and wanted to make my ride payment.
Step 2 — Mail Server Receives Email
The configured mail server receives the incoming email.
Our providers will be:
• Zoho Mail (I rarely recommend this)
• Google Workspace (Not this too)
• Microsoft 365 (Nope)
• Private Email Hosting (definitely if we wanna be able to manipulate things better ourselves,
cos it requires some email interception and listening)
• Custom SMTP/IMAP server (Same as above too)
At best, Private Email Hosting like PrivateEmail. The server stores the incoming email.
Step 3 — CRM Email Listener Detects Message
The Charter Keke backend server continuously listens for new incoming emails using:
• IMAP
• SMTP webhooks
• Email APIs
The backend then:
• Reads the email,
• Extracts sender information,
• Extracts subject,
• Extracts message body, and
• Extracts attachments/screenshots
Step 4 — Automatic Ticket Creation
The backend automatically creates a support ticket.
Example:
Ticket ID: #CK-2044
Customer: Jason Statham
Department: Support
Status: Open
Priority: High (or medium)
The email thread becomes the conversation thread inside the CRM.
Step 5 — Automated Acknowledgment Email
Immediately after ticket creation, the system automatically sends a response email.
Example:
Subject: Ticket Received — #CK-2044
Hello Jason,
Thank you for contacting Charter Keke Support.
Your request has been received successfully and assigned ticket ID #CK-2044.
A support representative will review your issue shortly.
Regards,
Charter Keke Support Team.
Now, this single feature alone significantly improves professionalism and customer trust. (plus the
fact that we responded almost immediately too. They’ll feel recognized and assured)
CRM Ticket Lifecycle
Every ticket should follow a defined lifecycle.
Suggested Ticket Statuses
Status Meaning
Open Ticket created and awaiting review
In Progress Being handled
Pending Customer Waiting for customer response
Escalated Sent to another department
Resolved Issue resolved
Closed Ticket completed permanently
CRM Dashboard Structure
The CRM should exist as a dedicated module inside the admin dashboard like I mentioned in my
previous message, like “admin/support/”.
Dashboard Sections
The CRM Dashboard;
├── Ticket Inbox
├── Live Chat
├── Email Inbox
├── Department Queues
├── Assigned Tickets
├── Internal Notes
├── Attachments
├── Knowledge Base
├── Escalation Center
├── Analytics
└── Settings
Ticket Inbox Design
The CRM inbox should be structured similarly to:
• Gmail
• Zendesk
• Freshdesk
Left Panel — Ticket List
Displays:
• Ticket ID
• Customer name
• Priority
• Department
• Last activity
• Ticket status
Example:
#CK-2031 — Payment Issue — Open
#CK-2032 — Driver Complaint — Escalated
#CK-2033 — Login Problem — Pending
Center Panel — Conversation Thread
Displays:
• Customer messages
• Admin replies
• Attachments
• Screenshots
• Timestamps
Which will be structured similarly to chat/email threads.
Right Panel — Ticket Metadata
Displays:
• Assigned admin
• Department
• Status
• Priority
• Tags
• Escalation history
• Internal notes
Internal Notes System
One of the most important CRM features is internal notes.
Cos, internal notes are:
• Visible only to staff
• Hidden from customers
• Used for interdepartmental collaboration
Example:
@Rider_Management; Please verify driver and apply investigative measures.
Rider Management team then responds:
Driver confirmed.
Driver investigation and account lockdown started.
Support can then respond professionally to the customer.
Role-Based Access Control
The CRM should support hierarchical admin permissions.
Suggested Roles, though we have some already, I’ll proceed to add more later;
Super Admin
Can:
• Manage entire CRM
• View all departments
• Assign administrators
• Configure system settings
Support Admin
Can:
• Handle customer tickets
• Reply to customers
• Assign tickets
• Escalate issues
Department Staff
Can:
• View tickets assigned to their department
• Add internal notes
• Participate in investigations
Technical Admin
Can:
• Handle technical incidents
• Monitor system logs
• Manage integrations
Real-Time In-App Support
The mobile app already supports real-time customer messaging.
This feature will be enhanced further to support:
• Screenshot uploads (it already supports it though)
• Attachment uploads (and it currently supports this),
• Typing indicators,
• Read receipts,
• Ticket conversion,
• Escalation workflows.
Every chat conversation should automatically become a structured support ticket inside the CRM.
Community Help Center & Knowledge Base
To reduce repetitive support requests, Charter Keke will implement a dedicated Help Center.
The purpose of the Help Center
The Help Center will provide:
• Frequently asked questions,
• Tutorials,
• Common issue resolutions,
• Rider guidance,
• Payment troubleshooting,
• Safety information as well
This reduces unnecessary support workload.
Example Help Center Categories
Help Center
├── Account Issues
├── Payments & Wallet
├── Rider Complaints
├── Booking Problems
├── Refund Requests
├── Safety Concerns
├── Technical Errors
├── Driver Verification
└── Promotions & Bonuses
Dynamic Knowledge Base Growth
The Help Center should continuously evolve.
As support teams observe recurring issues, they should:
1. Create new knowledge base articles.
2. Add troubleshooting steps.
3. Improve customer self-service.
This creates a scalable support ecosystem.
Suggested Automation Features
Phase 1 (adding to what we already have)
Core Features:
• Ticket creation (Implemented)
• Email integration
• Automated acknowledgment emails
• Ticket assignment (Integrated)
• Department tagging
• Internal notes
• Real-time support chat (Implemeted)
• Attachment support (Implemented)
Phase 2 (Advanced Features)
Advanced Features:
• SLA timers (Service level Agreements) [to make sure that issues are attended to in time]
• Escalation timers
• AI ticket routing
• Automated tagging
• Sentiment analysis
• WhatsApp integration
• Analytics dashboards
• Performance metrics
• Agent productivity tracking
• Auto-closing inactive tickets
Suggested Technology Architecture
Frontend (we have this)
• Next.js
• React
• Tailwind CSS
Backend
• Cron for background jobs
• Nodejs and background services
Real-Time Communication
• Socket.IO (we currently use supabase realtime)
Email Handling
• IMAP listeners
• SMTP integrations
• Mail webhooks
Database
• PostgreSQL (Supabase, which we already have)
File Storage
• Supabase Storage (Primary)
• Cloudinary (we’ll use this as we scale as Secondary Storage)
A Sample Workflow
Payment Issue Scenario
Customer
“My app crashed when I wanted to book a ride.”
Support Team
Creates ticket.
Operations Department
Asks and Checks the issue actually happens and if not, asks or investigates the conditions.
Technical Team
Checks the app locally on various devices and produce the updated patch.
Support Team
Updates customer professionally.
Ticket
Resolved and closed.
Long-Term Benefits
Implementing this CRM architecture will provide Charter Keke with:
• Professional customer operations
• Better issue tracking
• Faster response times
• Better accountability
• Operational transparency
• Easier scaling
• Improved customer trust
• Better departmental coordination
• Measurable support performance
Conclusion
The proposed CRM enhancement represents a major operational upgrade for Charter Keke.
Rather than functioning as a simple customer support inbox, the system will become a centralized
operational communication infrastructure capable of supporting:
• Customer support
• Internal collaboration
• Department workflows
• Automated communication
• Knowledge management
• Scalable operational growth as well.