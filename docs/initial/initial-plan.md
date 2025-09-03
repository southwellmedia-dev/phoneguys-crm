Development Project Brief: Custom CRM/Booking Platform for "The Phone Guys"
Project Goal: Develop a robust, scalable, and secure custom CRM/Booking platform to manage mobile device repair requests, orders, customer data, and internal operations for "The Phone Guys." This platform will integrate seamlessly with their existing Astro-based website.
Key Documents:
Attached Scope of Work/Feature List: Please refer to the provided document for a detailed breakdown of required functionalities (Online Repair Management, Order Management, Customer Relationship Management).
Technical Stack & Architecture:
Frontend: The CRM/Booking platform's frontend must be built using Next.js. The client's existing website is on Astro and will integrate with this platform via an API.
Backend/API: Develop a REST API (within the Next.js application, or as a separate service if deemed more appropriate for scalability, but tightly integrated) to facilitate communication between the Astro website (for form submissions) and the CRM/Booking platform.
Database & Authentication: Supabase will be used for all database-related queries and user authentication. We have an existing Supabase instance already set up that you will be provided access to and must use.
Best Practices: The development must adhere to industry best practices, including:
Proper Routing System: Implement a clear and maintainable routing structure (utilizing Next.js routing).
Repository Pattern: Utilize a repository layer for data access.
Service Layer: Implement a service layer to encapsulate business logic.
Design System: Develop a consistent and reusable design system for the UI.
Scalability & Maintainability: Ensure the architecture supports future growth and ease of maintenance.
Security: Implement robust security measures, especially concerning user data and authentication with Supabase.
Core Functionality Overview (as per attached document):
Online Repair Management:
Custom, multi-step repair submission form on the client's Astro website.
Automatic ticket creation in the CRM from website form submissions.
Capture details: Name, Email, Phone, Date Submitted, Device Information (Brand, Model, Serial Number/IMEI), Repair Issues.
Order Management:
Timer Management (Start/Stop for billing).
Customer Notes.
Submission Details/Job Hub.
Update Status (New, In Progress, On Hold, Complete).
Quick Actions (Email/Call Customers).
Auto-Email notifications on job completion or On Hold status.
Automatic staff email notifications for new submissions (including customer info, job number, order number).
Customer Relationship Management (CRM):
Manage individual submissions.
Export all visitor data.
Multi-user support (additional employees).
Find previous jobs.
Robust search function (email, job number, serial number, etc.).
Integration Points:
The Astro website's repair submission form will post data to the newly developed REST API (part of or connected to the Next.js application), which will then create a new entry/ticket in the provided Supabase database for the CRM.
The Next.js CRM dashboard will consume data from and interact with the provided Supabase database.
Deliverables:
Complete, fully functional CRM/Booking platform built with Next.js.
Well-documented REST API with clear endpoints and usage instructions.
Clean, commented, and maintainable codebase.
Deployment instructions.
Next Steps:
Please review this brief and the attached scope of work. We anticipate an initial technical architecture proposal and an estimated timeline for the project. Please flag any areas requiring further clarification.