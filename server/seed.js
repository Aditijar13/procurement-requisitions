require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Requisition = require("./models/Requisition");
const LineItem = require("./models/LineItem");
const HistoryEntry = require("./models/HistoryEntry");
const AlertDismissal = require("./models/AlertDismissal");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  await Promise.all([
    User.deleteMany(),
    Requisition.deleteMany(),
    LineItem.deleteMany(),
    HistoryEntry.deleteMany(),
    AlertDismissal.deleteMany(),
  ]);
  console.log("Cleared existing data");

  const password = await bcrypt.hash("password123", 12);

  const [priya, rohan, meera, arjun] = await User.insertMany([
    { name: "Priya Mehta",   email: "priya@demo.com",  password, role: "requester", department: "IT" },
    { name: "Rohan Desai",   email: "rohan@demo.com",  password, role: "requester", department: "HR" },
    { name: "Meera Kapoor",  email: "meera@demo.com",  password, role: "approver",  department: "Finance", approval_limit: mongoose.Types.Decimal128.fromString("75000") },
    { name: "Arjun Singhania", email: "arjun@demo.com", password, role: "approver", department: "Finance", approval_limit: mongoose.Types.Decimal128.fromString("300000") },
  ]);
  console.log("Users created");

  const now = new Date();
  const ago  = (n) => new Date(now - n * 86400000);
  const ahead = (n) => new Date(now.getTime() + n * 86400000);

  const makeReq = async ({ title, vendor, department, needed_by, status, requester, approvers, archived, lines }) => {
    const req = await Requisition.create({
      title, vendor, department, needed_by,
      status: status || "draft",
      requester,
      assigned_approvers: approvers || [],
      is_archived: archived || false,
      total: mongoose.Types.Decimal128.fromString("0"),
    });

    let total = 0;
    for (const l of lines) {
      const subtotal = l.quantity * l.unit_price;
      total += subtotal;
      await LineItem.create({
        requisition: req._id,
        description: l.description,
        quantity: l.quantity,
        unit_price: mongoose.Types.Decimal128.fromString(l.unit_price.toString()),
        received_qty: l.received_qty || 0,
      });
    }

    await Requisition.findByIdAndUpdate(req._id, {
      total: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
    });

    return req;
  };

  const log = (requisition, actor, action, comment, snapshot) =>
    HistoryEntry.create({ requisition, actor, action, comment: comment || "", snapshot: snapshot || {} });

  // 1. DRAFT — Priya, IT
  const r1 = await makeReq({
    title: "Standing Desks for IT Team",
    vendor: "Godrej Interio",
    department: "IT",
    needed_by: ahead(12),
    status: "draft",
    requester: priya._id,
    approvers: [meera._id],
    lines: [
      { description: "Electric Height-Adjustable Desk", quantity: 4, unit_price: 18000 },
      { description: "Monitor Arm (Dual)", quantity: 4, unit_price: 3500 },
    ],
  });
  await log(r1._id, priya._id, "created", "", { status: "draft" });

  // 2. SUBMITTED — Rohan, HR
  const r2 = await makeReq({
    title: "Ergonomic Office Chairs",
    vendor: "Featherlite Furniture",
    department: "HR",
    needed_by: ahead(8),
    status: "submitted",
    requester: rohan._id,
    approvers: [meera._id, arjun._id],
    lines: [
      { description: "Featherlite Ergo Pro Chair", quantity: 12, unit_price: 8500 },
      { description: "Anti-Fatigue Floor Mat",     quantity: 12, unit_price: 650  },
    ],
  });
  await log(r2._id, rohan._id, "created",   "", { status: "draft" });
  await log(r2._id, rohan._id, "submitted",  "", { old_status: "draft", new_status: "submitted" });

  // 3. SUBMITTED — Priya, high value — exceeds Meera's limit
  const r3 = await makeReq({
    title: "Network Infrastructure Upgrade",
    vendor: "Cisco Systems India",
    department: "IT",
    needed_by: ahead(20),
    status: "submitted",
    requester: priya._id,
    approvers: [meera._id, arjun._id],
    lines: [
      { description: "Cisco Catalyst 9200 Switch", quantity: 2, unit_price: 85000 },
      { description: "CAT6A Ethernet Cable (305m)", quantity: 4, unit_price: 4200  },
      { description: "Patch Panel 48-Port",         quantity: 2, unit_price: 3800  },
    ],
  });
  await log(r3._id, priya._id,  "created",   "", { status: "draft" });
  await log(r3._id, priya._id,  "submitted",  "", { old_status: "draft", new_status: "submitted" });
  await log(r3._id, meera._id,  "comment", `Total ₹187600 exceeds my approval limit ₹75000. Escalated to Arjun Singhania.`, { old_status: "submitted", new_status: "submitted" });

  // 4. APPROVED — Rohan, Finance, within Meera's limit
  const r4 = await makeReq({
    title: "Accounting Software Licences",
    vendor: "Tally Solutions Pvt Ltd",
    department: "Finance",
    needed_by: ahead(6),
    status: "approved",
    requester: rohan._id,
    approvers: [meera._id],
    lines: [
      { description: "Tally Prime Multi-User Licence", quantity: 5, unit_price: 9000 },
      { description: "Annual Maintenance Contract",    quantity: 5, unit_price: 1800 },
    ],
  });
  await log(r4._id, rohan._id, "created",   "", { status: "draft" });
  await log(r4._id, rohan._id, "submitted",  "", { old_status: "draft", new_status: "submitted" });
  await log(r4._id, meera._id, "approved",   "", { old_status: "submitted", new_status: "approved", approver_limit: 75000 });

  // 5. REJECTED — back to draft with reason
  const r5 = await makeReq({
    title: "Promotional Banners Q4",
    vendor: "PrintFast Co",
    department: "Marketing",
    needed_by: ahead(4),
    status: "draft",
    requester: priya._id,
    approvers: [meera._id],
    lines: [
      { description: "6x4 ft Flex Banner Full Colour", quantity: 15, unit_price: 950 },
    ],
  });
  await log(r5._id, priya._id, "created",   "", { status: "draft" });
  await log(r5._id, priya._id, "submitted",  "", { old_status: "draft", new_status: "submitted" });
  await log(r5._id, meera._id, "rejected",  "PrintFast Co is not on the approved vendor list. Please resubmit using PrintZone.", { old_status: "submitted", new_status: "draft", rejection_reason: "PrintFast Co is not on the approved vendor list. Please resubmit using PrintZone." });
  await log(r5._id, priya._id, "comment",   "Understood, will resubmit with PrintZone as vendor.", {});

  // 6. ORDERED — overdue — triggers alert for Meera and Arjun
  const r6 = await makeReq({
    title: "Warehouse Safety Equipment",
    vendor: "SafetyFirst Solutions",
    department: "Operations",
    needed_by: ago(6),
    status: "ordered",
    requester: rohan._id,
    approvers: [meera._id, arjun._id],
    lines: [
      { description: "Industrial Safety Helmet",   quantity: 25, unit_price: 480,  received_qty: 10 },
      { description: "Full-Body Safety Harness",   quantity: 10, unit_price: 1350, received_qty: 0  },
      { description: "High-Vis Reflective Vest",   quantity: 30, unit_price: 320,  received_qty: 30 },
    ],
  });
  const r6Items = await LineItem.find({ requisition: r6._id });
  const r6Helmet = r6Items.find(i => i.description === "Industrial Safety Helmet");
  const r6Vest = r6Items.find(i => i.description === "High-Vis Reflective Vest");
  await log(r6._id, rohan._id,  "created",   "", { status: "draft" });
  await log(r6._id, rohan._id,  "submitted",  "", { old_status: "draft", new_status: "submitted" });
  await log(r6._id, arjun._id,  "approved",   "", { old_status: "submitted", new_status: "approved", approver_limit: 300000 });
  await log(r6._id, arjun._id,  "ordered",    "", { old_status: "approved",  new_status: "ordered" });
  await log(r6._id, arjun._id,  "partially_received", "", {
    old_status: "ordered", new_status: "ordered",
    received_updates: [
      { itemId: r6Helmet._id, description: r6Helmet.description, received_qty: 10 },
      { itemId: r6Vest._id, description: r6Vest.description, received_qty: 30 },
    ],
  });

  // 7. ORDERED — not overdue, partially received
  const r7 = await makeReq({
    title: "Printer Consumables Q3",
    vendor: "HP India Pvt Ltd",
    department: "IT",
    needed_by: ahead(9),
    status: "ordered",
    requester: priya._id,
    approvers: [meera._id],
    lines: [
      { description: "HP LaserJet Toner Cartridge Black", quantity: 10, unit_price: 3400, received_qty: 4 },
      { description: "HP LaserJet Toner Cartridge Colour", quantity: 5, unit_price: 4900, received_qty: 0 },
      { description: "A4 Paper Ream 500 Sheets",           quantity: 50, unit_price: 290, received_qty: 50 },
    ],
  });
  const r7Items = await LineItem.find({ requisition: r7._id });
  const r7Black = r7Items.find(i => i.description === "HP LaserJet Toner Cartridge Black");
  const r7Paper = r7Items.find(i => i.description === "A4 Paper Ream 500 Sheets");
  await log(r7._id, priya._id,  "created",   "", { status: "draft" });
  await log(r7._id, priya._id,  "submitted",  "", { old_status: "draft", new_status: "submitted" });
  await log(r7._id, meera._id,  "approved",   "", { old_status: "submitted", new_status: "approved", approver_limit: 75000 });
  await log(r7._id, meera._id,  "ordered",    "", { old_status: "approved",  new_status: "ordered" });
    await log(r7._id, meera._id,  "partially_received", "", {
    old_status: "ordered", new_status: "ordered",
    received_updates: [
      { itemId: r7Black._id, description: r7Black.description, received_qty: 4 },
      { itemId: r7Paper._id, description: r7Paper.description, received_qty: 50 },
    ],
  });

  // 8. RECEIVED — fully complete
  const r8 = await makeReq({
    title: "Office Stationery Q2",
    vendor: "Staples India",
    department: "HR",
    needed_by: ago(2),
    status: "received",
    requester: rohan._id,
    approvers: [meera._id],
    lines: [
      { description: "Notebooks Pack of 10", quantity: 20, unit_price: 380, received_qty: 20 },
      { description: "Ballpoint Pen Box 50",  quantity: 10, unit_price: 145, received_qty: 10 },
      { description: "Sticky Notes 5-pack",   quantity: 15, unit_price: 95,  received_qty: 15 },
    ],
  });
  await log(r8._id, rohan._id,  "created",   "", { status: "draft" });
  await log(r8._id, rohan._id,  "submitted",  "", { old_status: "draft", new_status: "submitted" });
  await log(r8._id, meera._id,  "approved",   "", { old_status: "submitted", new_status: "approved", approver_limit: 75000 });
  await log(r8._id, meera._id,  "ordered",    "", { old_status: "approved",  new_status: "ordered" });
  await log(r8._id, meera._id,  "received",   "", { old_status: "ordered",   new_status: "received" });

  // 9. ARCHIVED — draft
  const r9 = await makeReq({
    title: "Old Reception Furniture Replacement",
    vendor: "Zuari Furniture",
    department: "Operations",
    needed_by: ago(25),
    status: "draft",
    requester: priya._id,
    approvers: [],
    archived: true,
    lines: [
      { description: "Reception Sofa 3-Seater", quantity: 2, unit_price: 22000 },
      { description: "Coffee Table",            quantity: 2, unit_price: 4500  },
    ],
  });
  await log(r9._id, priya._id, "created",  "", { status: "draft" });
  await log(r9._id, priya._id, "archived", "", { status: "draft" });

  // 10. ORDERED — overdue (second one for dashboard count = 2)
  const r10 = await makeReq({
    title: "Packaging Materials Restock",
    vendor: "PackPro Supplies",
    department: "Operations",
    needed_by: ago(4),
    status: "ordered",
    requester: rohan._id,
    approvers: [meera._id, arjun._id],
    lines: [
      { description: "Bubble Wrap Roll 50m",     quantity: 20, unit_price: 650, received_qty: 0 },
      { description: "Packing Tape Box 24-Pack", quantity: 10, unit_price: 480, received_qty: 0 },
      { description: "Cardboard Box Medium 50pk", quantity: 15, unit_price: 890, received_qty: 0 },
    ],
  });
  await log(r10._id, rohan._id,  "created",  "", { status: "draft" });
  await log(r10._id, rohan._id,  "submitted", "", { old_status: "draft", new_status: "submitted" });
  await log(r10._id, arjun._id,  "approved",  "", { old_status: "submitted", new_status: "approved", approver_limit: 300000 });
  await log(r10._id, arjun._id,  "ordered",   "", { old_status: "approved",  new_status: "ordered" });

  console.log("\nSeed complete ✓");
  console.log("\nDemo credentials:");
  console.log("  priya@demo.com  / password123  (requester — IT)");
  console.log("  rohan@demo.com  / password123  (requester — HR)");
  console.log("  meera@demo.com  / password123  (approver — limit ₹75,000)");
  console.log("  arjun@demo.com  / password123  (approver — limit ₹3,00,000)");

  await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });