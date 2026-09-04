# AI Prompts

I used AI assistants during development. Below are the significant prompts grouped by what I was trying to achieve, in roughly the order they happened.

---

## Deciding the database schema before writing any code

### Prompt
I have a procurement requisitions system to build. Should line items be embedded inside the requisition document or kept in a separate collection? I need to support partial receipt updates where only some quantities arrive.

### What you got
Walked through the tradeoff — embedding is simpler for reads but updating individual received quantities using MongoDB positional operators gets complicated when tracking partial delivery. A separate collection makes each line item independently updatable without array operator complexity.

### What you corrected
Nothing needed correction. This shaped the schema from the start and the decision held throughout the project. 

---

## Express 5 async middleware throwing "next is not a function"

### Prompt
My register endpoint is returning this error:
`TypeError: next is not a function`
The error points to my User.js pre-save hook. I am using Express 5 and Mongoose 9. Why this error?

### What you got
Express 5 wraps async handlers in a Promise automatically so calling next(err) inside try/catch conflicts with that. Mongoose 9 pre-save hooks no longer need the next parameter.

### What you corrected
Removed try/catch from all controllers and the next parameter from the pre-save hook. Applied the same fix to the auth middleware. Worked immediately.

---

## Decimal128 returning as object instead of number in API responses

### Prompt
My approval_limit field is coming back as `{"$numberDecimal": "100000"}` in the API response instead of a plain number. The toJSON transform on the schema is not fixing it. Why?

### What you got
The toJSON transform fires when Mongoose converts a whole document to JSON, but when you manually construct a response object in a controller and access `user.approval_limit` directly, the field value has not gone through the transform yet. The fix is to call `parseFloat(value.toString())` explicitly when building the response.

### What you corrected
Added `parseFloat(value.toString())` explicitly in the auth controller response. Also added toJSON transforms on the Requisition and LineItem models for their Decimal128 fields. All monetary values serialized correctly after that.

---

## MongoDB Atlas SRV connection failing

### Prompt
Connecting to MongoDB Atlas is throwing:
`querySrv ECONNREFUSED _mongodb._tcp.procurement-cluster.rmvuzpo.mongodb.net`
The cluster is created and network access is set to allow all IPs. What is wrong?

### What you got
The ISP or network might be blocking MongoDB SRV DNS lookups. Recommended switching to a direct connection string from the Atlas drivers page.


### What you corrected
Got the direct connection string from Atlas and updated the MONGO_URI in .env. Connected successfully after that. This was not a code issue but a network DNS issue specific to the development environment.

---

## Rejection going to wrong status

### Prompt
The README says rejection requires a reason and returns the requisition to Draft for its owner to amend and resubmit. I implemented rejection as keeping the status as rejected with a separate reopen endpoint. Is that correct?

### What you got
No — the README wording means the rejection itself should change the status to draft, not a separate step.


### What you corrected
Changed the rejectRequisition controller to set status to draft instead of rejected. The rejection reason is still preserved in the history entry so the full audit trail is maintained. Recorded as Decision 9 in decisions.md as the one decision I reversed.

---

## isAssigned check always returning false for approver

### Prompt
The approve and reject buttons are not showing for the approver on a submitted requisition even though approver is assigned. I added console logs and isAssigned is always false. The assigned_approvers array has data. What's wrong?

### What you got
AI identified that `a._id === user?._id` was comparing a MongoDB ObjectId string from the populated document against the user id stored in localStorage from the login response. The login response returns `id` not `_id` so `user._id` was undefined.

### What you corrected
Changed the comparison to `a._id?.toString() === (user?._id || user?.id)?.toString()` which handles both field names and converts both sides to strings before comparing. Approve and reject buttons appeared correctly after this fix.

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

---

## Polishing the documentation files

### Prompt
I have written bullet points for my architecture, schema, and decisions. Can you help turn these into proper sentences while keeping my reasoning and wording?

### What you got
Expanded the bullet points into full paragraphs keeping my structure and reasoning intact.

### What you corrected
Several decisions had the reasoning made too generic or the tradeoff flipped. Rewrote those sections to match what actually happened during development, including Decision 9 which I reversed mid-build and the alert re-surface logic which had the wrong condition in the first implementation.

---

## Git rebase losing commit timestamps

### Prompt
I want to push my frontend branch and merge it into main without a merge commit showing in history.

### What you got
Suggested using git rebase instead of merge and said it was safe for a personal repo.

### What you corrected
Rebase rewrote the commit timestamps — doc commits made on Sep 1 started showing today's date on GitHub. Had to use git reflog to find the original commits and cherry-pick them back onto main to restore the correct author dates.

---

## Approval limit enforcement — incomplete answer initially

### Prompt
When an approver's limit is exceeded, what should happen? Should I just return an error or do something else?

### What you got
Initially suggested just returning a 403 error with a message saying the limit was exceeded.

### What you corrected
That was incomplete — the README says to find and assign a higher approver automatically. Updated the controller to query for the next approver with a sufficient limit and add them to assigned_approvers before returning the error. This is the clearest case where the first answer needed real correction.

---

## Alert re-surface logic — wrong condition initially

### Prompt
When the needed-by date is extended on an ordered requisition, should I clear all alert dismissals so the alert comes back?

### What you got
Yes, clear all dismissals whenever the date changes.

### What you corrected
Wrong — if the new date is in the future the requisition is no longer overdue so the alert should not reappear. Changed it to only clear dismissals if the new date has also already passed.

---

## Generating seed data for demo

### Prompt
I need seed data covering every requisition status, overdue alerts, partial receipt, and approval limit escalation.

### What you got
Suggested the data structure : 4 users with two requesters and two approvers with different limits, requisitions covering every status from draft to received including two overdue ordered ones, history entries for each, and partial receipt data on the ordered ones.

### What you corrected
Nothing structural — I reviewed the data and adjusted the needed_by dates so the dashboard KPIs would show meaningful numbers, and changed one received requisition date to fall within the current week so the weekly chart had data to display.

---

## Writing the README

### Prompt
Based on my project structure, roles, features, and tech stack, help me write a proper README.

### What you got
A draft README with features, tech stack, roles, project structure, setup instructions, and a docs table.

### What you corrected
The demo credentials section had placeholder names from earlier testing. Updated to match the actual seed users. Also reviewed the feature list against the spec to make sure nothing was overstated.

---

## Alert badge not updating after dismiss

### Prompt
The alert badge in the sidebar shows the old count even after dismissing an alert on the alerts page. The two components are independent so they don't share state. How do I make the badge refresh immediately after dismiss?

### What you got
Suggested using a custom browser event : dispatch `alerts-updated` from the Alerts page after dismiss, and listen for it in the Sidebar to trigger an immediate refetch.

### What you corrected
Also found that the sidebar had no polling at all — the useEffect only ran once on mount with no setInterval. Added 60-second polling alongside the event listener so the badge stays fresh even without user interaction.