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

