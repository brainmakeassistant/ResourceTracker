# ResourceTracker — Status

**Last updated:** 2026-03-28
**Repo:** brainmakeassistant/ResourceTracker
**Branch:** master
**Local:** C:\Users\Monroe\workspace\resource-tracker\ResourceTracker\
**Stack:** Next.js 15 + TypeScript + Prisma 5 + SQLite + Tailwind CSS + Recharts

---

## What's Done

### Data Model (Prisma/SQLite)
- Practice, Resource, Project, Assignment, Actual, PTORequest, PTOApproval
- Manager ↔ Resource self-relation, PM ↔ Assignment relation
- Bill rate + cost rate on Resource for profitability calc
- Excel import script loads all data from spreadsheet (197 resources, 18 projects, 185 assignments)

### Pages (15 pages, all verified 200)
| Page | Description |
|------|-------------|
| `/` | Dashboard — stats cards + over-allocated resources table |
| `/resources` | Filterable list (practice, type, search) with current hrs/wk |
| `/resources/[id]` | Detail — summary cards, assignments, bill/cost rates |
| `/resources/[id]/edit` | Edit form |
| `/resources/new` | Create form |
| `/projects` | List with assignment counts, status badges |
| `/projects/[id]` | Detail — team view, weekly revenue/margin |
| `/projects/[id]/edit` | Edit form |
| `/projects/new` | Create form |
| `/assignments` | Full list with Active/Future/Past status, ending-soon warnings |
| `/assignments/new` | Create form (resource, project, PM, activity, dates, hrs/wk) |
| `/capacity` | Color-coded heatmap — 17 weeks, grouped by practice, hover tooltips |
| `/financials` | Practice + project profitability tables, IC/EE mix charts (Recharts) |
| `/actuals` | Upload Excel actuals, forecast vs actual comparison table |
| `/pto` | PTO requests list + request form with approval workflow |

### API Routes
- Resources: GET, POST, PUT, DELETE (soft-delete via isActive)
- Projects: GET, POST, PUT, DELETE
- Assignments: GET, POST, PUT, DELETE
- PTO: GET, POST + approval endpoint (auto-creates approval entries for manager + PMs)
- Actuals: POST upload (Excel/CSV parsing, fuzzy name matching, upsert)

---

## What's Next
1. **Email + calendar invite for PTO approvals** — needs Resend or AWS SES setup; send .ics attachment after all approvals complete
2. **Import Springahead actuals** — the spreadsheet has a "Springahead" tab with ~549 rows of actual hours data; needs to be imported into the Actual table
3. **Authentication (NextAuth)** — email/password or SSO; gate pages by role (user sees own data, PM sees project, admin sees all)
4. **Deploy** — recommended: Vercel (free) + Neon PostgreSQL (free), or OCI Always Free compute + Autonomous DB

## Blockers
- None currently. App runs locally, all pages functional, data loaded from spreadsheet.
- PTO email requires choosing an email provider (Resend free tier = 100 emails/day).
- Deployment requires PostgreSQL migration (currently SQLite for local dev).
