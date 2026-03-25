import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("Seeding database with production-ready data...\n");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.peerFeedback.deleteMany();
  await prisma.peerNomination.deleteMany();
  await prisma.reviewCompetency.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reviewCycle.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.okrCycle.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const password = hashSync("password123", 10);

  // ═══════════════════════════════════════════════════════════════
  // FOUNDERS (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  const pattar = await prisma.user.create({
    data: { email: "pattar@company.com", passwordHash: password, name: "Shrishail Pattar", role: "ADMIN" },
  });
  const pradeep = await prisma.user.create({
    data: { email: "pradeep@company.com", passwordHash: password, name: "Pradeep Kumar", role: "ADMIN" },
  });
  const abilash = await prisma.user.create({
    data: { email: "abilash@company.com", passwordHash: password, name: "Abilash Reddy", role: "ADMIN" },
  });
  const ravi = await prisma.user.create({
    data: { email: "ravi@company.com", passwordHash: password, name: "Ravi Shankar", role: "ADMIN" },
  });

  // ═══════════════════════════════════════════════════════════════
  // DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════
  const embedded = await prisma.department.create({ data: { name: "Embedded Systems", founderId: pattar.id } });
  const operations = await prisma.department.create({ data: { name: "Operations", founderId: pattar.id } });
  const hr = await prisma.department.create({ data: { name: "HR & Admin", founderId: pattar.id } });
  const accounts = await prisma.department.create({ data: { name: "Finance & Accounts", founderId: pattar.id } });
  const salesMarketing = await prisma.department.create({ data: { name: "Sales & Marketing", founderId: pradeep.id } });
  const software = await prisma.department.create({ data: { name: "Software & Creative", founderId: abilash.id } });
  const rnd = await prisma.department.create({ data: { name: "R&D & Innovation", founderId: ravi.id } });

  // ═══════════════════════════════════════════════════════════════
  // TEAM LEADS
  // ═══════════════════════════════════════════════════════════════
  const tlData = [
    { name: "Arun Kumar", email: "arun@company.com", dept: embedded, reportsTo: pattar },
    { name: "Meena Sharma", email: "meena@company.com", dept: operations, reportsTo: pattar },
    { name: "Deepa Rao", email: "deepa@company.com", dept: hr, reportsTo: pattar },
    { name: "Karthik Reddy", email: "karthik@company.com", dept: accounts, reportsTo: pattar },
    { name: "Sneha Gupta", email: "sneha@company.com", dept: salesMarketing, reportsTo: pradeep },
    { name: "Vikram Singh", email: "vikram@company.com", dept: software, reportsTo: abilash },
    { name: "Ananya Patel", email: "ananya@company.com", dept: rnd, reportsTo: ravi },
  ];

  const tls: Record<string, { id: string; name: string }> = {};
  for (const tl of tlData) {
    const created = await prisma.user.create({
      data: {
        email: tl.email, passwordHash: password, name: tl.name,
        role: "TEAM_LEAD", departmentId: tl.dept.id, reportsToId: tl.reportsTo.id,
      },
    });
    tls[tl.dept.id] = created;
  }

  // ═══════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ═══════════════════════════════════════════════════════════════
  const empData = [
    // Embedded (4)
    { name: "Rahul Verma", email: "rahul@company.com", dept: embedded },
    { name: "Priya Nair", email: "priya@company.com", dept: embedded },
    { name: "Suresh Babu", email: "suresh@company.com", dept: embedded },
    { name: "Harish Gowda", email: "harish@company.com", dept: embedded },
    // Operations (3)
    { name: "Lakshmi Devi", email: "lakshmi@company.com", dept: operations },
    { name: "Mohan Raj", email: "mohan@company.com", dept: operations },
    { name: "Ramya Shetty", email: "ramya@company.com", dept: operations },
    // HR (2)
    { name: "Kavitha Menon", email: "kavitha@company.com", dept: hr },
    { name: "Sanjay Joshi", email: "sanjay@company.com", dept: hr },
    // Accounts (3)
    { name: "Divya Krishnan", email: "divya@company.com", dept: accounts },
    { name: "Venkat Subramani", email: "venkat@company.com", dept: accounts },
    { name: "Preeti Desai", email: "preeti@company.com", dept: accounts },
    // Sales & Marketing (4)
    { name: "Arjun Mehta", email: "arjun@company.com", dept: salesMarketing },
    { name: "Neha Agarwal", email: "neha@company.com", dept: salesMarketing },
    { name: "Tarun Bhat", email: "tarun@company.com", dept: salesMarketing },
    { name: "Megha Kulkarni", email: "megha@company.com", dept: salesMarketing },
    // Software & Creative (5)
    { name: "Rohan Das", email: "rohan@company.com", dept: software },
    { name: "Aditi Hegde", email: "aditi@company.com", dept: software },
    { name: "Nikhil Sharma", email: "nikhil@company.com", dept: software },
    { name: "Pooja Iyer", email: "pooja@company.com", dept: software },
    { name: "Amit Jain", email: "amit@company.com", dept: software },
    // R&D (4)
    { name: "Ganesh Murthy", email: "ganesh@company.com", dept: rnd },
    { name: "Swathi Prakash", email: "swathi@company.com", dept: rnd },
    { name: "Ajay Kulkarni", email: "ajay@company.com", dept: rnd },
    { name: "Nandini Rao", email: "nandini@company.com", dept: rnd },
  ];

  const emps: { id: string; name: string; deptId: string }[] = [];
  for (const emp of empData) {
    const created = await prisma.user.create({
      data: {
        email: emp.email, passwordHash: password, name: emp.name,
        role: "EMPLOYEE", departmentId: emp.dept.id, reportsToId: tls[emp.dept.id].id,
      },
    });
    emps.push({ id: created.id, name: created.name, deptId: emp.dept.id });
  }

  // ═══════════════════════════════════════════════════════════════
  // OKR CYCLES
  // ═══════════════════════════════════════════════════════════════
  const q4Cycle = await prisma.okrCycle.create({
    data: {
      name: "Q4 2025", quarter: 4, year: 2025,
      startDate: new Date("2025-10-01"), endDate: new Date("2025-12-31"), status: "CLOSED",
    },
  });
  const q1Cycle = await prisma.okrCycle.create({
    data: {
      name: "Q1 2026", quarter: 1, year: 2026,
      startDate: new Date("2026-01-01"), endDate: new Date("2026-03-31"), status: "ACTIVE",
    },
  });
  await prisma.okrCycle.create({
    data: {
      name: "Q2 2026", quarter: 2, year: 2026,
      startDate: new Date("2026-04-01"), endDate: new Date("2026-06-30"), status: "DRAFT",
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // COMPANY-LEVEL OKRs (Q1 2026)
  // ═══════════════════════════════════════════════════════════════
  const companyRevenue = await prisma.objective.create({
    data: {
      title: "Achieve 40% revenue growth in Q1 2026",
      description: "Drive aggressive growth through new client acquisition and upselling existing accounts",
      type: "COMPANY", status: "ON_TRACK", progress: 68, ownerId: pattar.id, cycleId: q1Cycle.id,
    },
  });
  await prisma.keyResult.createMany({
    data: [
      { title: "Increase MRR to 50 Lakhs", targetValue: 50, currentValue: 34, unit: "Lakhs", progress: 68, objectiveId: companyRevenue.id },
      { title: "Onboard 15 new enterprise clients", targetValue: 15, currentValue: 11, unit: "clients", progress: 73, objectiveId: companyRevenue.id },
      { title: "Reduce customer churn to under 5%", targetValue: 5, currentValue: 6.8, unit: "%", progress: 60, objectiveId: companyRevenue.id },
    ],
  });

  const companyProduct = await prisma.objective.create({
    data: {
      title: "Launch 2 new product lines by end of Q1",
      description: "Expand product portfolio to address emerging market needs in IoT and AI",
      type: "COMPANY", status: "AT_RISK", progress: 45, ownerId: abilash.id, cycleId: q1Cycle.id,
    },
  });
  await prisma.keyResult.createMany({
    data: [
      { title: "Complete IoT gateway product development", targetValue: 100, currentValue: 60, unit: "%", progress: 60, objectiveId: companyProduct.id },
      { title: "Launch AI-powered analytics dashboard", targetValue: 100, currentValue: 30, unit: "%", progress: 30, objectiveId: companyProduct.id },
    ],
  });

  const companyTalent = await prisma.objective.create({
    data: {
      title: "Strengthen team capabilities and culture",
      description: "Build a high-performance culture through hiring, training, and engagement initiatives",
      type: "COMPANY", status: "ON_TRACK", progress: 72, ownerId: pattar.id, cycleId: q1Cycle.id,
    },
  });
  await prisma.keyResult.createMany({
    data: [
      { title: "Hire 8 key positions across departments", targetValue: 8, currentValue: 6, unit: "hires", progress: 75, objectiveId: companyTalent.id },
      { title: "Achieve employee satisfaction score of 4.2+", targetValue: 4.2, currentValue: 4.0, unit: "score", progress: 70, objectiveId: companyTalent.id },
      { title: "Complete 100% of performance reviews on time", targetValue: 100, currentValue: 70, unit: "%", progress: 70, objectiveId: companyTalent.id },
    ],
  });

  // ═══════════════════════════════════════════════════════════════
  // DEPARTMENT-LEVEL OKRs (Q1 2026)
  // ═══════════════════════════════════════════════════════════════
  const deptOkrs = [
    {
      title: "Deliver embedded firmware v3.0 for IoT gateway",
      dept: embedded, owner: tls[embedded.id], parent: companyProduct, progress: 55, status: "AT_RISK",
      krs: [
        { title: "Complete BLE 5.3 stack integration", target: 100, current: 70, unit: "%", progress: 70 },
        { title: "Pass all EMC compliance tests", target: 12, current: 5, unit: "tests", progress: 42 },
        { title: "Reduce boot time to under 2 seconds", target: 2, current: 2.8, unit: "seconds", progress: 50 },
      ],
    },
    {
      title: "Streamline supply chain and reduce lead times by 20%",
      dept: operations, owner: tls[operations.id], parent: companyRevenue, progress: 60, status: "ON_TRACK",
      krs: [
        { title: "Negotiate 3 new vendor contracts", target: 3, current: 2, unit: "contracts", progress: 67 },
        { title: "Implement inventory management system", target: 100, current: 55, unit: "%", progress: 55 },
      ],
    },
    {
      title: "Build robust hiring pipeline and onboarding process",
      dept: hr, owner: tls[hr.id], parent: companyTalent, progress: 78, status: "ON_TRACK",
      krs: [
        { title: "Reduce time-to-hire to 25 days", target: 25, current: 28, unit: "days", progress: 75 },
        { title: "Onboard 6 new hires with 95% satisfaction", target: 6, current: 5, unit: "hires", progress: 83 },
        { title: "Launch employee engagement survey", target: 100, current: 75, unit: "%", progress: 75 },
      ],
    },
    {
      title: "Improve financial reporting and cash flow management",
      dept: accounts, owner: tls[accounts.id], parent: companyRevenue, progress: 70, status: "ON_TRACK",
      krs: [
        { title: "Automate monthly P&L generation", target: 100, current: 80, unit: "%", progress: 80 },
        { title: "Reduce DSO to 30 days", target: 30, current: 38, unit: "days", progress: 60 },
      ],
    },
    {
      title: "Drive 50% increase in qualified leads pipeline",
      dept: salesMarketing, owner: tls[salesMarketing.id], parent: companyRevenue, progress: 82, status: "ON_TRACK",
      krs: [
        { title: "Generate 200 MQLs via digital campaigns", target: 200, current: 175, unit: "leads", progress: 88 },
        { title: "Achieve 15% website conversion rate", target: 15, current: 12, unit: "%", progress: 80 },
        { title: "Close 5 strategic partnerships", target: 5, current: 3, unit: "deals", progress: 60 },
      ],
    },
    {
      title: "Ship 3 major product features with zero P0 bugs",
      dept: software, owner: tls[software.id], parent: companyProduct, progress: 65, status: "ON_TRACK",
      krs: [
        { title: "Deploy real-time dashboard feature", target: 100, current: 90, unit: "%", progress: 90 },
        { title: "Launch mobile app v2.0", target: 100, current: 45, unit: "%", progress: 45 },
        { title: "Achieve 99.9% uptime SLA", target: 99.9, current: 99.7, unit: "%", progress: 60 },
      ],
    },
    {
      title: "File 2 patents and prototype next-gen sensor platform",
      dept: rnd, owner: tls[rnd.id], parent: companyProduct, progress: 40, status: "BEHIND",
      krs: [
        { title: "Submit patent applications", target: 2, current: 1, unit: "patents", progress: 50 },
        { title: "Complete sensor fusion prototype", target: 100, current: 30, unit: "%", progress: 30 },
      ],
    },
  ];

  for (const okr of deptOkrs) {
    const obj = await prisma.objective.create({
      data: {
        title: okr.title, type: "DEPARTMENT", status: okr.status, progress: okr.progress,
        ownerId: okr.owner.id, departmentId: okr.dept.id, cycleId: q1Cycle.id,
        parentObjectiveId: okr.parent.id,
      },
    });
    await prisma.keyResult.createMany({
      data: okr.krs.map((kr) => ({
        title: kr.title, targetValue: kr.target, currentValue: kr.current,
        unit: kr.unit, progress: kr.progress, objectiveId: obj.id,
      })),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // INDIVIDUAL OKRs
  // ═══════════════════════════════════════════════════════════════
  const individualOkrs = [
    { empIdx: 0, title: "Master BLE 5.3 protocol and deliver driver module", progress: 75, status: "ON_TRACK",
      krs: [{ title: "Complete BLE driver for nRF5340", target: 100, current: 85, unit: "%", progress: 85 }, { title: "Write unit tests with 90% coverage", target: 90, current: 65, unit: "%", progress: 72 }] },
    { empIdx: 4, title: "Automate warehouse inventory tracking system", progress: 60, status: "ON_TRACK",
      krs: [{ title: "Integrate barcode scanning API", target: 100, current: 80, unit: "%", progress: 80 }, { title: "Reduce manual counting by 50%", target: 50, current: 20, unit: "%", progress: 40 }] },
    { empIdx: 12, title: "Launch Q1 digital marketing campaign for IoT products", progress: 88, status: "ON_TRACK",
      krs: [{ title: "Create 20 content pieces", target: 20, current: 18, unit: "pieces", progress: 90 }, { title: "Achieve 10K website visits", target: 10000, current: 8500, unit: "visits", progress: 85 }] },
    { empIdx: 16, title: "Build real-time analytics dashboard for clients", progress: 90, status: "ON_TRACK",
      krs: [{ title: "Implement WebSocket data streaming", target: 100, current: 100, unit: "%", progress: 100 }, { title: "Build 5 chart widgets", target: 5, current: 4, unit: "widgets", progress: 80 }] },
    { empIdx: 17, title: "Redesign UI/UX for mobile app v2.0", progress: 50, status: "AT_RISK",
      krs: [{ title: "Complete Figma mockups for all screens", target: 24, current: 15, unit: "screens", progress: 63 }, { title: "Conduct 5 user testing sessions", target: 5, current: 2, unit: "sessions", progress: 40 }] },
    { empIdx: 21, title: "Develop ML model for predictive maintenance", progress: 35, status: "BEHIND",
      krs: [{ title: "Collect training dataset (10K samples)", target: 10000, current: 4500, unit: "samples", progress: 45 }, { title: "Achieve 85% prediction accuracy", target: 85, current: 62, unit: "%", progress: 25 }] },
    { empIdx: 7, title: "Implement new employee onboarding portal", progress: 80, status: "ON_TRACK",
      krs: [{ title: "Design and launch onboarding checklist", target: 100, current: 90, unit: "%", progress: 90 }, { title: "Reduce onboarding time from 7 to 4 days", target: 4, current: 5, unit: "days", progress: 70 }] },
    { empIdx: 9, title: "Automate GST filing and compliance reporting", progress: 65, status: "ON_TRACK",
      krs: [{ title: "Integrate Tally with GST portal", target: 100, current: 70, unit: "%", progress: 70 }, { title: "Reduce filing errors to zero", target: 0, current: 2, unit: "errors", progress: 60 }] },
  ];

  for (const okr of individualOkrs) {
    const emp = emps[okr.empIdx];
    const obj = await prisma.objective.create({
      data: {
        title: okr.title, type: "INDIVIDUAL", status: okr.status, progress: okr.progress,
        ownerId: emp.id, departmentId: emp.deptId, cycleId: q1Cycle.id,
      },
    });
    await prisma.keyResult.createMany({
      data: okr.krs.map((kr) => ({
        title: kr.title, targetValue: kr.target, currentValue: kr.current,
        unit: kr.unit, progress: kr.progress, objectiveId: obj.id,
      })),
    });
  }

  // Closed Q4 OKR
  const q4Obj = await prisma.objective.create({
    data: { title: "Achieve product-market fit for core platform", type: "COMPANY", status: "COMPLETED", progress: 100, ownerId: pattar.id, cycleId: q4Cycle.id },
  });
  await prisma.keyResult.createMany({
    data: [
      { title: "Reach 50 paying customers", targetValue: 50, currentValue: 53, unit: "customers", progress: 100, objectiveId: q4Obj.id },
      { title: "Achieve NPS score of 40+", targetValue: 40, currentValue: 45, unit: "score", progress: 100, objectiveId: q4Obj.id },
    ],
  });

  // ═══════════════════════════════════════════════════════════════
  // REVIEW CYCLES
  // ═══════════════════════════════════════════════════════════════
  const annualReview = await prisma.reviewCycle.create({
    data: { name: "Annual Review FY 2025-26", year: 2026, startDate: new Date("2026-03-01"), endDate: new Date("2026-04-15"), status: "ACTIVE" },
  });
  await prisma.reviewCycle.create({
    data: { name: "Mid-Year Review H1 2025", year: 2025, startDate: new Date("2025-09-01"), endDate: new Date("2025-10-15"), status: "CLOSED" },
  });

  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE REVIEWS (realistic mixed statuses)
  // ═══════════════════════════════════════════════════════════════
  const competencies = ["Goal Achievement", "Technical Skills", "Communication", "Leadership & Initiative", "Teamwork & Collaboration"];
  const deptFounderMap: Record<string, string> = {
    [embedded.id]: pattar.id, [operations.id]: pattar.id, [hr.id]: pattar.id, [accounts.id]: pattar.id,
    [salesMarketing.id]: pradeep.id, [software.id]: abilash.id, [rnd.id]: ravi.id,
  };

  // TL reviews
  const tlReviewData = [
    { tl: tls[embedded.id], dept: embedded, status: "COMPLETED", selfR: 4.2, tlR: 4.0, mgmtR: 4.4, final: 4.2, selfC: "I have led the team well through the firmware v3.0 development cycle.", tlC: null, mgmtC: "Strong technical leadership. Keep pushing the team on delivery timelines." },
    { tl: tls[operations.id], dept: operations, status: "COMPLETED", selfR: 3.8, tlR: 3.5, mgmtR: 3.6, final: 3.6, selfC: "Managed vendor relationships and streamlined procurement.", tlC: null, mgmtC: "Solid operational management. Focus more on cost optimization." },
    { tl: tls[software.id], dept: software, status: "COMPLETED", selfR: 4.6, tlR: 4.8, mgmtR: 4.5, final: 4.6, selfC: "Delivered real-time dashboard ahead of schedule with the team.", tlC: null, mgmtC: "Outstanding performance. A key driver of our product quality." },
    { tl: tls[salesMarketing.id], dept: salesMarketing, status: "TL_REVIEW", selfR: 4.0, tlR: null, mgmtR: null, final: null, selfC: "Led the team to achieve 88% of MQL targets. Working on partnership deals.", tlC: null, mgmtC: null },
    { tl: tls[hr.id], dept: hr, status: "SELF_REVIEW", selfR: 3.6, tlR: null, mgmtR: null, final: null, selfC: "Successfully onboarded 5 new hires and launched engagement survey.", tlC: null, mgmtC: null },
    { tl: tls[accounts.id], dept: accounts, status: "NOT_STARTED", selfR: null, tlR: null, mgmtR: null, final: null, selfC: null, tlC: null, mgmtC: null },
    { tl: tls[rnd.id], dept: rnd, status: "MGMT_REVIEW", selfR: 4.0, tlR: 3.8, mgmtR: null, final: null, selfC: "Filed 1 patent and progressed the sensor prototype.", tlC: "Good technical depth but needs to accelerate prototype timeline.", mgmtC: null },
  ];

  for (const rd of tlReviewData) {
    const review = await prisma.review.create({
      data: {
        reviewCycleId: annualReview.id, employeeId: rd.tl.id, tlReviewerId: null,
        mgmtReviewerId: deptFounderMap[rd.dept.id],
        selfRating: rd.selfR, selfComments: rd.selfC, tlRating: rd.tlR, tlComments: rd.tlC,
        mgmtRating: rd.mgmtR, mgmtComments: rd.mgmtC, finalScore: rd.final, status: rd.status,
      },
    });
    const baseScores = [[4,4,4,5,4],[4,3,4,3,4],[5,5,4,5,4],[4,4,4,4,3],[3,4,4,3,4],[3,3,3,3,3],[4,4,3,4,4]];
    const idx = tlReviewData.indexOf(rd);
    await prisma.reviewCompetency.createMany({
      data: competencies.map((name, i) => ({
        reviewId: review.id, competencyName: name,
        selfScore: rd.selfR ? baseScores[idx][i] : null,
        tlScore: rd.tlR ? baseScores[idx][i] + (i % 2 === 0 ? -0.5 : 0.5) : null,
        mgmtScore: rd.mgmtR ? baseScores[idx][i] : null,
      })),
    });
  }

  // Employee reviews
  const reviewStatuses = [
    "COMPLETED","COMPLETED","COMPLETED","COMPLETED","COMPLETED",
    "MGMT_REVIEW","MGMT_REVIEW","TL_REVIEW","TL_REVIEW","TL_REVIEW",
    "SELF_REVIEW","SELF_REVIEW","SELF_REVIEW","SELF_REVIEW",
    "NOT_STARTED","NOT_STARTED","NOT_STARTED","NOT_STARTED","NOT_STARTED",
    "NOT_STARTED","NOT_STARTED","NOT_STARTED","NOT_STARTED","NOT_STARTED","NOT_STARTED"];

  const completedScores = [
    { self: 4.4, tl: 4.2, mgmt: 4.6, final: 4.36 },
    { self: 3.2, tl: 3.0, mgmt: 3.4, final: 3.2 },
    { self: 4.8, tl: 4.6, mgmt: 4.4, final: 4.56 },
    { self: 3.6, tl: 3.8, mgmt: 3.4, final: 3.56 },
    { self: 4.0, tl: 4.2, mgmt: 4.0, final: 4.08 },
  ];

  const selfComments = [
    "I have consistently delivered quality work and met my targets for this cycle.",
    "This quarter was challenging but I managed to complete most of my key deliverables.",
    "I exceeded expectations by taking on additional responsibilities beyond my role.",
    "I focused on improving my technical skills and contributing to team projects.",
    "I believe my work on the campaign significantly contributed to our lead generation targets.",
  ];
  const tlComments = "Good performance overall. Shows initiative and delivers quality work consistently. Needs to focus more on cross-team collaboration.";
  const mgmtComments = "Strong contributor to the department goals. Continue developing leadership skills and mentoring junior team members.";

  for (let i = 0; i < emps.length; i++) {
    const emp = emps[i];
    const status = reviewStatuses[i] || "NOT_STARTED";
    const scores = status === "COMPLETED" && i < 5 ? completedScores[i] : null;

    const review = await prisma.review.create({
      data: {
        reviewCycleId: annualReview.id, employeeId: emp.id,
        tlReviewerId: tls[emp.deptId].id, mgmtReviewerId: deptFounderMap[emp.deptId],
        selfRating: scores?.self ?? (["MGMT_REVIEW","TL_REVIEW","SELF_REVIEW"].includes(status) ? 3.6 + (i % 5) * 0.2 : null),
        selfComments: status !== "NOT_STARTED" ? selfComments[i % 5] : null,
        tlRating: scores?.tl ?? (["MGMT_REVIEW","COMPLETED"].includes(status) ? 3.8 + (i % 3) * 0.2 : null),
        tlComments: ["MGMT_REVIEW","COMPLETED"].includes(status) ? tlComments : null,
        mgmtRating: scores?.mgmt ?? null,
        mgmtComments: status === "COMPLETED" ? mgmtComments : null,
        finalScore: scores?.final ?? null, status,
      },
    });

    await prisma.reviewCompetency.createMany({
      data: competencies.map((name, ci) => ({
        reviewId: review.id, competencyName: name,
        selfScore: status !== "NOT_STARTED" ? 3 + (ci + i) % 3 : null,
        tlScore: ["COMPLETED","MGMT_REVIEW"].includes(status) ? 3 + (ci + i + 1) % 3 : null,
        mgmtScore: status === "COMPLETED" ? 3 + (ci + i + 2) % 3 : null,
      })),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PEER NOMINATIONS & 360 FEEDBACK
  // ═══════════════════════════════════════════════════════════════
  const feedbackComments = [
    { comments: "Consistently delivers high-quality work. Great at explaining complex concepts to the team.", strengths: "Technical expertise, problem-solving, mentoring juniors", improvements: "Could be more proactive in cross-department communication" },
    { comments: "Reliable and thorough. Always willing to help others when they're stuck.", strengths: "Dependability, teamwork, attention to detail", improvements: "Should take on more leadership opportunities" },
    { comments: "Innovative thinker who brings fresh ideas to the table. Great energy.", strengths: "Creativity, initiative, positive attitude", improvements: "Time management could be improved when handling multiple projects" },
    { comments: "Strong communicator who bridges gaps between technical and business teams.", strengths: "Communication, stakeholder management, adaptability", improvements: "Could deepen technical skills in newer technologies" },
    { comments: "Hardworking and dedicated. Stays focused even under tight deadlines.", strengths: "Work ethic, resilience, domain knowledge", improvements: "Should participate more actively in team discussions" },
  ];

  for (let i = 0; i < 10; i++) {
    const emp = emps[i];
    const peerIndices = [(i + 1) % emps.length, (i + 4) % emps.length, (i + 8) % emps.length].filter((p) => p !== i);

    for (let j = 0; j < peerIndices.length; j++) {
      const pi = peerIndices[j];
      const isApproved = i < 7;

      await prisma.peerNomination.create({
        data: {
          reviewCycleId: annualReview.id, employeeId: emp.id, peerId: emps[pi].id,
          status: isApproved ? "APPROVED" : "PENDING",
          approvedById: isApproved ? tls[emp.deptId].id : null,
        },
      });

      if (isApproved) {
        const isCompleted = i < 5;
        const fb = feedbackComments[(i + j) % feedbackComments.length];
        await prisma.peerFeedback.create({
          data: {
            reviewCycleId: annualReview.id, fromUserId: emps[pi].id, toUserId: emp.id,
            isAnonymous: j % 2 === 0,
            status: isCompleted ? "COMPLETED" : "PENDING",
            rating: isCompleted ? 3.0 + ((i + j) % 5) * 0.4 : null,
            comments: isCompleted ? fb.comments : null,
            strengths: isCompleted ? fb.strengths : null,
            improvements: isCompleted ? fb.improvements : null,
          },
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  const notifications = [
    { userId: pattar.id, type: "REVIEW_STATUS", title: "5 Reviews Completed", message: "5 employee reviews have been finalized in the Annual Review cycle.", link: "/reviews", read: false },
    { userId: pattar.id, type: "OKR_UPDATE", title: "Q1 OKR Progress Update", message: "Company revenue OKR is at 68% progress. On track for Q1 targets.", link: "/okrs", read: true },
    { userId: pattar.id, type: "NOMINATION", title: "New Peer Nominations", message: "3 new peer nominations are pending your approval.", link: "/feedback", read: false },
    { userId: pattar.id, type: "REVIEW_STATUS", title: "Review Pending Calibration", message: "Ananya Patel's team lead review is ready for management calibration.", link: "/reviews", read: false },
    { userId: pradeep.id, type: "REVIEW_STATUS", title: "TL Review Submitted", message: "Team Lead review for Sneha Gupta's self-assessment is pending your action.", link: "/reviews", read: false },
    { userId: pradeep.id, type: "OKR_UPDATE", title: "Sales Pipeline Strong", message: "Sales & Marketing department OKRs are at 82% progress. Great momentum!", link: "/okrs", read: true },
    { userId: abilash.id, type: "OKR_UPDATE", title: "Product Launch Needs Attention", message: "AI dashboard feature is at 30%. Needs acceleration to meet Q1 deadline.", link: "/okrs", read: false },
    { userId: abilash.id, type: "REVIEW_STATUS", title: "Vikram's Review Completed", message: "Vikram Singh's annual review has been completed with a score of 4.6.", link: "/reviews", read: true },
    { userId: ravi.id, type: "REVIEW_STATUS", title: "Review Pending Calibration", message: "Ananya Patel's review is ready for your management calibration.", link: "/reviews", read: false },
    { userId: ravi.id, type: "OKR_UPDATE", title: "R&D OKRs Behind Schedule", message: "R&D department OKRs are at 40%. Patent filing and prototype need acceleration.", link: "/okrs", read: false },
    { userId: tls[software.id].id, type: "REVIEW_STATUS", title: "Self-Reviews Submitted", message: "3 team members have completed their self-assessments. Ready for your review.", link: "/reviews", read: false },
    { userId: tls[software.id].id, type: "FEEDBACK_REQUEST", title: "Feedback Requested", message: "You have been nominated to provide feedback for Aditi Hegde.", link: "/feedback", read: false },
    { userId: tls[salesMarketing.id].id, type: "OKR_UPDATE", title: "Campaign Performing Well", message: "Digital campaign has generated 175 of 200 target MQLs. 88% complete!", link: "/okrs", read: true },
    { userId: emps[0].id, type: "REVIEW_STATUS", title: "Review Completed", message: "Your annual performance review is complete. Final score: 4.36.", link: "/reviews", read: false },
    { userId: emps[0].id, type: "FEEDBACK_RECEIVED", title: "Peer Feedback Received", message: "You have received new peer feedback for the annual review cycle.", link: "/feedback", read: false },
    { userId: emps[16].id, type: "REVIEW_ASSIGNED", title: "Performance Review Started", message: "Your annual review has been initiated. Please complete your self-assessment.", link: "/reviews", read: false },
    { userId: emps[12].id, type: "OKR_UPDATE", title: "OKR Nearly Complete", message: "Your digital marketing campaign OKR is at 88%. Keep pushing!", link: "/okrs", read: false },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("Seed completed successfully!\n");
  console.log("════════════════════════════════════════════════════════════");
  console.log("                    PerfOS — Seed Summary                  ");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`  Users:          4 Founders + 7 TLs + ${emps.length} Employees = ${4 + 7 + emps.length}`);
  console.log(`  Departments:    7`);
  console.log(`  OKR Cycles:     3 (Q4 Closed, Q1 Active, Q2 Draft)`);
  console.log(`  Objectives:     3 Company + 7 Dept + ${individualOkrs.length} Individual + 1 Closed`);
  console.log(`  Review Cycles:  2 (Annual Active, Mid-Year Closed)`);
  console.log(`  Reviews:        ${emps.length + 7} (mixed statuses)`);
  console.log(`  Notifications:  ${notifications.length}`);
  console.log("════════════════════════════════════════════════════════════");
  console.log("\n  Password: password123 (all users)\n");
  console.log("  Founders:   pattar@ | pradeep@ | abilash@ | ravi@");
  console.log("  Team Leads: arun@ | meena@ | deepa@ | karthik@ | sneha@ | vikram@ | ananya@");
  console.log("  Employees:  rahul@ | rohan@ | arjun@ | ganesh@ | etc.");
  console.log("  (all @company.com)\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
