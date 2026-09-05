# Decisions

These are the decisions that actually shaped the codebase. Each one had a real alternative I considered, and I have recorded why I went the way I did.

## Decision 1

- **Chose:** Separate client and server applications communicating through a REST API.

- **Rejected:** A single Express application serving both the frontend and backend.

- **Why:** Keeping them separate meant the backend was a proper API from day one - every endpoint was testable without needing a UI at all. This mattered because I built and tested the entire backend before touching the frontend. If the server had been rendering HTML, I would have had to build both layers together and debugging would have been significantly harder. It also meant deploying independently -  Vercel for the React client, Render for the Express server, which is cleaner than managing one server doing both jobs.

## Decision 2

- **Chose:** A single `logHistory` utility function as the only write path for history entries.

- **Rejected:** Writing history inserts directly inside each controller wherever a status change happened.

- **Why:** History needs to be consistent across every action — submission, approval, rejection, ordering, receiving, comments, approver changes, partial receipts. That is thirteen different places where a history entry gets created. If I wrote the insert directly in each controller the format would drift, I would forget to include it somewhere, and changing the history structure later would mean touching every controller. A single utility function means every entry has the same shape. It also made it structurally impossible to accidentally create an update or delete path — the utility only ever creates.

## Decision 3

- **Chose:** Line items in a separate collection.

- **Rejected:** Embedding line items as an array inside the requisition document.

- **Why:** My first instinct was to embed them since they belong to exactly one requisition. What changed my mind was the receiving workflow, when items arrive partially, I need to update `received_qty` on individual line items independently. With an embedded array that means MongoDB positional operators, which get complicated when you have multiple items and only some have arrived. A separate collection makes each update a normal document operation. It also keeps the requisition document a predictable size regardless of how many items it contains.

## Decision 4

- **Chose:** Fetch the approver's approval limit from the database on every approve request.

- **Rejected:** Reading the limit from the JWT token or trusting a value sent by the client.

- **Why:** The JWT carries the user's id and role but not their approval limit. I could have included the limit in the token at login, but then the token would go stale if the limit was changed later. I could have let the client send the limit in the request body, but that is trivially manipulable - anyone could just send a higher number. Fetching it fresh from the database on every approve call adds one extra query but means the check is always against the current value. This is the one place in the codebase I was most careful about not trusting anything from the client.

## Decision 5

- **Chose:** Enforce all roles and workflow rules on the server in middleware and controllers.

- **Rejected:** Hiding restricted actions only in the React frontend.

- **Why:** A hidden button is not a security boundary. Anyone can call the API directly with Thunder Client or curl and bypass the interface entirely — I was doing exactly that myself throughout backend development. Role checks therefore happen in the `protect` and `requireRole` middleware before the request reaches a controller, and workflow rules are checked again inside the controller. The approval limit check is the clearest example of this - it is enforced in the controller regardless of what the frontend shows or hides.

## Decision 6

- **Chose:** Lifecycle transitions as explicit server-side checks in each controller.

- **Rejected:** Letting the client set the status field directly to any value.

- **Why:** The procurement workflow has a defined sequence and skipping steps causes real problems. You cannot mark something received if it was never ordered. You cannot approve something that was never submitted. Each lifecycle controller checks the current status before allowing the action and returns a specific error message if the move is invalid. This also made testing easier, I could test each transition individually in Thunder Client and verify the right things were being blocked before touching the frontend.

## Decision 7

- **Chose:** Store the calculated total on the requisition and recalculate it whenever a line item changes.

- **Rejected:** Calculating the total from line items on every read.

- **Why:** The total gets used in two important places : displaying it in the list view and comparing it against an approver's limit during approval. If I recalculated it from line items every time, the list endpoint would need an aggregation query for every row returned. Storing it means the list is a simple find with no extra work per row. The tradeoff is a small extra write whenever a line item is added, updated, or deleted, but reads are far more frequent than writes so this is the right direction. The total is always recalculated server-side — the client can never set it directly.

## Decision 8

- **Chose:** `Decimal128` for all monetary fields -  `unit_price`, `approval_limit`, and `total`.

- **Rejected:** JavaScript `Number` for these fields.

- **Why:** Approval limits and requisition totals are compared directly against each other to decide whether an approver can approve a purchase. Floating point arithmetic introduces small errors — `0.1 + 0.2` is not exactly `0.3` in JavaScript. That kind of imprecision in a financial comparison is a real bug. `Decimal128` stores exact decimal values. The downside is it does not serialize to JSON automatically, so I had to add `parseFloat(value.toString())` in response objects and `toJSON` transforms across all models. Small fixed cost for correctness on money.

## Decision 9

- **Chose:** Rejection returns the requisition directly to draft status.

- **Rejected:** Keeping the status as rejected and requiring a separate reopen action from the requester.

- **Why:** I built it as two steps initially : rejection set the status to `rejected`, then the requester had to explicitly call a reopen endpoint to get back to draft. When I re-read the README it said rejection "returns the requisition to Draft for its owner to amend and resubmit." That is one step, not two. The rejection reason is still preserved in the history entry so the full audit trail is there, but the requester can edit and resubmit immediately without an extra step.

- **Later reversed:** Originally implemented rejection and reopening as two separate steps. Changed after re-reading the README : rejection now moves the status directly to draft.

## Decision 10

- **Chose:** Enforce history immutability architecturally : no update or delete routes exist anywhere in the codebase for history entries.

- **Rejected:** Relying on a policy or runtime check to prevent history from being changed.

- **Why:** A policy that says "do not edit history" only works if everyone follows it. An architectural constraint that says "there is no route to edit history" cannot be violated through the API at all. The `HistoryEntry` model has no update or delete endpoints. The only write path is the `logHistory` utility function, which only ever creates. If someone wanted to tamper with the audit trail they would have to modify the source code , they cannot do it by calling an API endpoint. This distinction mattered because the README specifically required that nothing in the history timeline can be edited or deleted after the fact, including by approvers.

## Decision 11

- **Chose:** `AlertDismissal` as a separate collection with a compound unique index on requisition and user.

- **Rejected:** A `dismissed` flag on the requisition document.

- **Why:** A single flag on the requisition would dismiss the alert for every approver at once. But two approvers assigned to the same requisition can have different dismissal states : one may have seen the overdue alert and dismissed it while the other still needs to act on it. A separate collection stores one record per user per requisition so each approver's dismissal is independent. The re-trigger logic was also cleaner this way , when the needed-by date is extended and passes again, deleting the dismissal record is all it takes to make the alert reappear for that user. No requisition mutation required.

## Decision 12

- **Chose:** CSS Modules for component styling.

- **Rejected:** A single global stylesheet or inline styles.

- **Why:** With global CSS, class names are shared across the entire app. A class like `.table` or `.btn` defined in one page would affect every component using the same name. CSS Modules scope each file's classes to that component automatically so there are no naming conflicts even when using the same class names across different pages. It also made cleanup straightforward — each component owns its styles, so deleting a page means deleting one file, not hunting through a global stylesheet for classes that might or might not be used elsewhere.

## Decision 13

- **Chose:** Bulk approve as a toggle mode that filters the list to submitted-only before selection.

- **Rejected:** Showing checkboxes on every row at all times.

- **Why:** Checkboxes on every row looked messy and implied you could select received or rejected requisitions when you can't. The toggle enters a mode that hides everything except submitted ones so it's obvious what can be acted on. Cancel exits and restores the full list. It also prevents accidental bulk actions since you have to explicitly enter the mode first.

## Decision 14

- **Chose:** Archive as a global flag set only by the requisition owner (requester), hidden from approvers entirely.

- **Rejected:** Per-user archive like AlertDismissal, or letting approvers archive independently.

- **Why:** The spec says requisitions belong to one requester as owner. Archive reads like an ownership action, when the owner is done with it, it's done for everyone. Alert dismissal is per-approver because the spec explicitly says each approver can dismiss independently. Archive has no such distinction so I kept it simple with a global flag.

- **Later reversed:** Initially showed the archived nav link to all users. Removed it for approvers after realising they never archive anything, the page would always be empty for them.

## Decision 15

- **Chose:** Scope dashboard metrics to the requester's own requisitions when the viewer is a requester.

- **Rejected:** Showing global numbers to everyone.

- **Why:** The dashboard initially showed global numbers regardless of role : a requester would see counts and totals across all requisitions, not just theirs. That's misleading since requesters only own their own requisitions and can't act on anyone else's. Approvers need the global view because they manage everything. Fixed by building a `baseMatch` filter in the dashboard controller that adds a requester ID condition for requester-role users before running any aggregation.

- **Later reversed:** Initially built the dashboard with no role-based filtering at all : same numbers showed for everyone. Caught this during testing when logging in as a requester and seeing departments and requisitions that weren't theirs. Fixed in the dashboard controller by scoping all aggregation queries to the requester's own data when the logged-in user is a requester.

## Decision 16

- **Chose:** Poll the alerts endpoint every 60 seconds in the Sidebar for the badge count, with an immediate refetch triggered by a custom browser event after dismiss.

- **Rejected:** Fetching the count once on mount and never updating it.

- **Why:** The initial implementation only ran the alert count fetch once when the Sidebar mounted. This meant the badge showed a stale number after an approver dismissed an alert — it would only update on a full page refresh. The Sidebar and Alerts page are independent components with no shared parent that owns alert state, so the simplest way to trigger an immediate update after dismiss was a custom browser event. The Alerts page dispatches `alerts-updated` after a successful dismiss, and the Sidebar listens for it and refetches. Polling every 60 seconds runs alongside this so the badge also stays accurate when alerts become overdue without any user action.
