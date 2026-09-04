# Architecture

## What are the moving pieces, and how do they talk to each other?

The system is split into three main parts:

* A React frontend
* A Node.js and Express backend
* A MongoDB database

The frontend is responsible for the user interface. It contains the application's pages and reusable components and communicates with the backend through HTTP requests using Axios.

The backend exposes REST API endpoints and contains the main business logic. Express routes receive requests, middleware handles authentication and role-based authorization, controllers process the requests and apply workflow rules, and Mongoose models communicate with MongoDB.

MongoDB stores the application's persistent data, including users, requisitions, line items, history entries, and alert dismissal records.

The frontend does not communicate directly with the database. Requests go through the backend API.

The overall communication flow is:

```text
React Frontend
      ↓
Axios HTTP Request
      ↓
Express Route
      ↓
Authentication / Authorization Middleware
      ↓
Controller / Business Logic
      ↓
Mongoose Model
      ↓
MongoDB
      ↓
JSON Response
      ↓
React UI Update
```

---

## Where does each piece run?

During development, the frontend and backend run as separate applications.

### Frontend

The React frontend runs in the user's browser and is served during development using Vite.

The frontend is located in the `client/` directory and contains pages, reusable components, authentication state, and API communication logic.

### Backend

The backend runs as a Node.js application using Express.

It is located in the `server/` directory and contains routes, controllers, middleware, models, configuration, and utility functions.

### Database

MongoDB runs separately from both the frontend and backend.

The Express backend connects to MongoDB through Mongoose. The database is not exposed directly to the frontend.

The development architecture can be represented as:

```text
Browser
   │
   ▼
React + Vite Frontend
   │
   │ HTTP / REST API Requests
   ▼
Node.js + Express Backend
   │
   │ Mongoose
   ▼
MongoDB
```

---

## What is the request path for one representative user action, end to end?

One representative user action is approving a requisition.

An approver opens a submitted requisition and chooses the Approve action.

### Step 1: User action

The approver clicks the Approve action on the requisition details page.

### Step 2: Frontend request

The React frontend sends a `PATCH` request to the requisition approval endpoint.

Axios includes the user's JWT in the Authorization header so that the backend can identify the authenticated user.

### Step 3: Express route

The request reaches the lifecycle route for approving a requisition.

The route is protected using authentication middleware and requires the user to have the `approver` role.

### Step 4: Authentication middleware

The `protect` middleware verifies the JWT and identifies the logged-in user.

If the token is invalid or missing, the request is rejected.

### Step 5: Role authorization

The `requireRole("approver")` middleware checks that the authenticated user has the approver role.

### Step 6: Controller and business logic

The `approveRequisition` controller processes the request.

It checks that:

* The requisition exists.
* The requisition is currently in the `submitted` status.
* The authenticated approver is assigned to the requisition.
* The approver's current approval limit is sufficient for the requisition total.

If the requisition total exceeds the approver's limit, the system attempts to find and assign an approver with sufficient approval authority instead of approving the requisition.

### Step 7: Database update

If the approval is valid, the requisition status is updated to `approved` through Mongoose.

### Step 8: History recording

The system creates a history entry recording the approval action and the relevant status change.

### Step 9: Backend response

The backend returns a JSON response confirming that the requisition was approved.

### Step 10: Frontend update

The React frontend receives the response and updates the user interface.

The complete request path is:

```text
Approver clicks Approve
        ↓
React Requisition Detail Page
        ↓
Axios PATCH Request
        ↓
JWT Authorization Header
        ↓
Express Lifecycle Route
        ↓
protect Middleware
        ↓
requireRole("approver")
        ↓
approveRequisition Controller
        ↓
Validate Status, Assignment, and Approval Limit
        ↓
Update Requisition in MongoDB
        ↓
Create History Entry
        ↓
JSON Response
        ↓
React UI Update
```

---

## What did you decide *not* to build, and why?


**No register page.** Users are created through the seed script. The spec doesn't ask for self-registration and building one would mean deciding things like who assigns approval limits and roles, that's an admin concern that wasn't in scope.

**No auto-assignment of approvers.** The spec says any approver can add or remove eligibility on a requisition but doesn't say who gets assigned automatically. I didn't want to invent a rule that wasn't asked for. The full queue is visible to all approvers so nothing gets missed, someone just has to manually assign.

**No real-time updates.** The alert badge polls every 60 seconds. The spec doesn't mention live updates and polling was good enough for what was asked.

**None of the stretch goals.** I finished all 10 goals and had some time left but chose to spend it on fixing edge cases and writing proper documentation rather than starting a stretch feature half-done.