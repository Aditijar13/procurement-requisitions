# Plan

This document records the development of the Procurement Requisitions application across work sessions.

I started by building the backend foundation and core requisition workflow before moving to the frontend. This allowed the main API and business rules to be established before the frontend was connected to them.

Backend API endpoints were tested during development using the Thunder Client extension in VS Code.

## How did I break the work into sessions?

I divided the work into sessions based on major parts of the application. Each session has a main focus, with the next session building on the work completed previously.

### Session 1 — Project foundation and authentication

**Planned / Estimated**
- Set up the initial project structure.
- Create the main database models.
- Set up the React client.
- Implement authentication before protected application features.

**What actually happened**
- Created separate `client` and `server` applications.
- Set up the initial Mongoose models.
- Set up the React client.
- Implemented user registration and login.
- Added JWT authentication middleware.

**Notes**
- Completing authentication early provided a foundation for protecting the backend features added in later sessions.

---

### Session 2 — Core requisition workflow

**Planned / Estimated**
- Build the main requisition workflow.
- Add line-item management.
- Add requisition total calculation.
- Add lifecycle handling and approver assignment.

**What actually happened**
- Implemented CRUD operations for requisitions.
- Implemented CRUD operations for requisition line items.
- Added server-side calculation of requisition totals.
- Added lifecycle/state-machine logic for requisition status changes.
- Added approver assignment.

**Testing**
- Tested backend endpoints using Thunder Client in VS Code.

**Notes**
- The core workflow was completed before moving on to supporting features such as history, export, alerts, and dashboard data.

---

### Session 3 — Backend expansion and review

**Planned / Estimated**
- Extend the backend with approval and history features.
- Add search, filtering, and pagination.
- Add reporting and dashboard functionality.
- Review the backend as features were added.

**What actually happened**
- Added requisition history logging.
- Added bulk approval functionality.
- Added CSV export.
- Added search, filtering and pagination.
- Added overdue alerts.
- Added user-related endpoints.
- Added dashboard aggregation endpoints.
- Added archived filtering to the requisition list.
- Reviewed the combined backend functionality and corrected missing or incorrect behaviour.

**Testing**
- Continued testing backend API behaviour using Thunder Client.

**Notes**
- More time was needed for reviewing and correcting the backend after implementing a large number of features.
- This delayed the move into frontend work slightly but helped establish a more stable backend before integration.

---

### Session 4 — Frontend foundation and main views

**Planned / Estimated**
- Start frontend development against the existing backend APIs.
- Build the application layout and authentication flow.
- Build the dashboard.
- Build the requisitions list.

**What actually happened**
- Built the login page.
- Added frontend authentication context.
- Added application routing.
- Built the sidebar and main application layout.
- Built the dashboard with KPI cards and data breakdowns.
- Added the weekly chart.
- Built the requisitions list.
- Added search, filters, sorting, and pagination.

**Notes**
- Having the main backend APIs available made it easier to build these frontend pages around an established data flow.

---

### Session 5 — Requisition detail page and documentation

**Planned / Estimated**
- Continue building the frontend requisition workflow.
- Implement the Requisition Detail page.
- Start maintaining the required documentation alongside development.

**What actually happened so far**
- Started implementing the Requisition Detail page.
- Continued refining the connection between the requisitions list and individual requisition records.

**Currently in progress**
- Completing the Requisition Detail page.
- Refining individual requisition actions and frontend behaviour.
- Continuing the remaining documentation files.

**Notes / Adjustments**
- This session is still in progress, so the final outcome will be updated once the current work is completed.

---

### Remaining sessions

**Planned**
- Complete unfinished required functionality.
- Integrate and test frontend workflows against backend APIs.
- Test important backend endpoints again using Thunder Client.
- Fix bugs and edge cases discovered during integration.
- Refine the UI where necessary.
- Complete and review all required documentation.
- Perform a final requirement review before submission.

**What actually happened**
- To be updated as the remaining sessions are completed.

---

## What order did I build in, and why that order?

I started with the project structure, database models, and authentication because the later features depend on having a defined data structure and authenticated users.

I then implemented the core requisition workflow before adding supporting functionality. Requisitions, line items, total calculation, lifecycle rules, and approver assignment form the main business logic of the application, so I wanted these working first before building dependent features such as history, export, search, alerts, and dashboard summaries.

After expanding and reviewing the backend, I moved to the frontend. This allowed the frontend pages to be built against an established API and business logic, reducing the need to repeatedly change the UI as backend behaviour evolved.

---

## What did I estimate versus what it actually took?

I estimated that the initial backend foundation and core requisition workflow would need to be completed before I could move into frontend development. The core backend progressed quickly, and I was able to implement more supporting functionality than just the initial workflow, including history, bulk actions, export, search, alerts, and dashboard data.

However, the actual work took longer than simply implementing each feature once. After adding the larger backend feature set, I needed additional time to review the combined workflow and correct missing or incorrect behaviour before relying on it for frontend integration.

As a result, frontend development started slightly later than initially expected, but this reduced rework because the frontend could be built against a more stable backend.

Since the project is still in progress, this comparison will be updated after the remaining project is completed.

---

## What did I cut when I ran short?
