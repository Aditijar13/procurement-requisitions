# AI Prompts

I used Claude (claude.ai) and ChatGPT as AI assistants during development. Below are the significant prompts grouped by what I was trying to achieve, in roughly the order they happened.

---

## Deciding the database schema before writing any code

### Prompt
I have a procurement requisitions system to build. Should line items be embedded inside the requisition document or kept in a separate collection? I need to support partial receipt updates where only some quantities arrive.

### What you got
Claude walked through the tradeoff — embedding is simpler for reads but updating individual received quantities using MongoDB positional operators gets complicated when tracking partial delivery. A separate collection makes each line item independently updatable without array operator complexity.

### What you corrected
Nothing needed correction. This shaped the schema from the start and the decision held throughout the project. Recorded as Decision 3 in decisions.md.

---

## Express 5 async middleware throwing "next is not a function"

### Prompt
My register endpoint is returning this error:
`TypeError: next is not a function`
The error points to my User.js pre-save hook. I am using Express 5 and Mongoose 9. Why this error?

### What you got
Claude explained that both Express 5 and Mongoose 9 changed how async functions are handled. Express 5 wraps async route handlers in a Promise automatically, so calling next(err) inside try/catch conflicts with that internal handling. Mongoose 9 async pre-save hooks no longer need the next parameter at all — Mongoose waits for the Promise to resolve.

### What you corrected
Removed try/catch from all controllers and let Express 5 catch errors natively. Also removed the next parameter from the User.js pre-save hook. Applied the same fix to the auth middleware. This was the right answer and worked immediately.

---

## Decimal128 returning as object instead of number in API responses

### Prompt
My approval_limit field is coming back as `{"$numberDecimal": "100000"}` in the API response instead of a plain number. The toJSON transform on the schema is not fixing it. Why?

### What you got
Claude explained that the toJSON transform fires when Mongoose converts a whole document to JSON, but when you manually construct a response object in a controller and access `user.approval_limit` directly, the field value has not gone through the transform yet. The fix is to call `parseFloat(value.toString())` explicitly when building the response.

### What you corrected
Applied the fix in the auth controller register and login responses. Also added toJSON transforms on the Requisition and LineItem models for their Decimal128 fields. After this fix all monetary values serialized correctly across all endpoints.

---

## MongoDB Atlas SRV connection failing

### Prompt
Connecting to MongoDB Atlas is throwing:
`querySrv ECONNREFUSED _mongodb._tcp.procurement-cluster.rmvuzpo.mongodb.net`
The cluster is created and network access is set to allow all IPs. What is wrong?

### What you got
Claude suggested the ISP or network might be blocking MongoDB SRV DNS lookups. Recommended switching from the mongodb+srv:// connection string to a direct connection string from the Atlas drivers page.

### What you corrected
Got the direct connection string from Atlas and updated the MONGO_URI in .env. Connected successfully after that. This was not a code issue but a network DNS issue specific to the development environment.

---

## Approval limit enforcement — where to check it

### Prompt
The README says approval fails when the total exceeds the approver's own approval limit and it must be enforced on the server not just hidden in the interface. Where exactly should this check happen and what should it do when it fails?

### What you got
Claude confirmed the check should happen in the approveRequisition controller, fetching the approver's current limit fresh from the database on every request rather than trusting the JWT token. When the limit is exceeded, find an approver with a higher limit and assign them automatically, then return an error explaining the escalation.

### What you corrected
Initially only returned an error message without assigning the higher approver. Updated to also query for and assign the next available approver with a sufficient limit before returning the error.

---

## Rejection going to wrong status

### Prompt
The README says rejection requires a reason and returns the requisition to Draft for its owner to amend and resubmit. I implemented rejection as keeping the status as rejected with a separate reopen endpoint. Is that correct?

### What you got
Claude pointed out the README wording — "returns the requisition to Draft" — which means rejection itself should change the status to draft immediately, not require a separate reopen step.

### What you corrected
Changed the rejectRequisition controller to set status to draft instead of rejected. The rejection reason is still preserved in the history entry so the full audit trail is maintained. Recorded as Decision 9 in decisions.md as the one decision I reversed.

---

## isAssigned check always returning false for approver

### Prompt
The approve and reject buttons are not showing for the approver on a submitted requisition even though spprover is assigned. I added console logs and isAssigned is always false. The assigned_approvers array has data. What's wrong?

### What you got
Claude identified that `a._id === user?._id` was comparing a MongoDB ObjectId string from the populated document against the user id stored in localStorage from the login response. The login response returns `id` not `_id` so `user._id` was undefined.

### What you corrected
Changed the comparison to `a._id?.toString() === (user?._id || user?.id)?.toString()` which handles both field names and converts both sides to strings before comparing. Approve and reject buttons appeared correctly after this fix.

---

## Draft requisitions visible to approvers

### Prompt
The assigned approver can see draft requisitions in the list. The README says requesters see only their own and approvers review submitted requisitions. Drafts should not be visible to approvers at all.

### What you got
Claude identified that the getRequisitions controller was only filtering by requester for requesters but not excluding drafts for approvers. Suggested adding `query.status = { $ne: "draft" }` for approvers when no status filter is applied.

### What you corrected
Added the draft exclusion for approvers. Also found that when an approver applied a status filter, it would override the draft exclusion. Fixed by merging the conditions so the status filter only applies if it is not draft when the user is an approver. Also removed the Draft option from the status dropdown in the frontend filter for approvers.

---

## UI reference for requisition detail page layout

### What I was trying to achieve
Getting a visual layout reference for the requisition detail page before building it since it is the most complex page in the application.

### What I asked ChatGPT
Generated a mockup of a procurement requisition detail page with a two column layout showing line items, approver panel, summary, and history timeline.

### What you got
A detailed mockup with header metadata, line items table, status workflow sidebar, summary panel, and history timeline.

### What you corrected
The mockup had fields not in our requirements including priority, attachment tabs, requisition type, and a multi-step status workflow sidebar. I used it only as a layout reference. The actual page was built based on our five collections and the README requirements. Several iterations were needed for the table styling, history toggle behaviour, and role-based action button visibility.