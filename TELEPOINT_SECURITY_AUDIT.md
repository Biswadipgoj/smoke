# TelePoint EMI Portal — Application Security Audit

**Target:** `github.com/biswajitkhanra/telepoint` (public repository)
**Commit audited:** `da7fc01` — *"Fix: completed customers with pending fines must stay Completed (#127)"*
**Stack:** Next.js 14.2.16 (App Router) · Supabase Postgres + Auth · TypeScript · Tailwind · Vercel-style deployment
**Audit date:** 10 August 2026
**Scope:** Full repository — 31 API routes, middleware, RLS policies, 28 SQL migrations, React frontend, CI workflows, dependencies.
**Method:** Static review only (white-box source analysis). No live instance was tested, no exploit code was produced.

---

## 1. Executive Summary

TelePoint is a multi-tenant EMI (instalment-financing) portal. Three parties share one database: a **super admin** who sees everything, **retailers** who must only ever see their own customers, and **customers** who view their own loan read-only. The entire security model therefore rests on one question: *is every request checked against the caller's retailer?*

For most of the codebase the answer is yes. The Row Level Security design is genuinely well built, the payment-approval path is atomic and admin-gated, `lib/csv.ts` does correct RFC-4180 quoting, `lib/loanStatementHtml.ts` escapes HTML properly, and **no secrets are hardcoded anywhere in the repository** — every key is read from the environment. Someone has clearly thought about this.

The problem is that the application does almost all of its data access through `createServiceClient()`, the Supabase **service-role** client, which bypasses RLS completely. That is a legitimate pattern, but it moves 100% of the authorization burden from the database into each individual route handler. Where a handler forgets a check, there is no second line of defence — the carefully written RLS policies never even execute.

**Nine such handlers forget.** Three report endpoints (`/api/report/customer-profit`, `/api/report/fine-due`, `/api/report/profit`) check only that the caller is *logged in*, then dump every customer belonging to *every* retailer — names, mobile numbers, IMEIs, purchase values, profit margins. Any retailer with a valid login can download the entire competitor book as a CSV. `/api/retailers` is worse: its `PATCH` has no role check, so any authenticated retailer can reset **any other retailer's login password** and take over their account; its `DELETE` has no authorization check in the handler at all.

Two further issues raise the ceiling on all of the above. First, `next@14.2.16` is affected by **CVE-2025-29927**, a middleware authorization bypass — and `middleware.ts` is the *only* thing standing in front of the routes that lack their own checks. Second, the `Database backup` GitHub Action is designed to commit a complete dump of every table — including customer Aadhaar numbers — into `backups/latest/` **in this public repository**. It has never run (verified against full git history: no blob has ever existed under that path), so no data is currently exposed, but the moment `PORTAL_URL` and `BACKUP_TOKEN` secrets are added, the entire customer database becomes permanently public.

**Verdict: not suitable for production in its current state.** The good news is that the fixes are small and mechanical. Nothing here requires re-architecting — the shape of the correct solution already exists in the codebase (`app/api/retailer/dashboard/route.ts` demonstrates exactly the right scoping pattern; it simply was not applied uniformly). A focused two-to-three day remediation pass closes every Critical and High finding.

### Security Score

| | |
|---|---|
| **Score** | **28 / 100** |
| Authentication | 55 / 100 — solid Supabase foundation, no MFA, no rate limiting, no session revocation |
| **Authorization** | **10 / 100** — nine endpoints missing checks; cross-tenant reads and account takeover |
| Database / RLS | 60 / 100 — well-designed policies, but bypassed everywhere and missing one `WITH CHECK` |
| API security | 30 / 100 — no rate limiting, mass assignment, raw error leakage |
| Frontend | 65 / 100 — React escapes by default; server-rendered HTML routes do not |
| Secrets management | 90 / 100 — clean; nothing committed |
| Configuration | 25 / 100 — zero security headers, build-time checks disabled |
| Dependencies | 20 / 100 — framework carries a known auth-bypass CVE |
| Logging / audit | 45 / 100 — audit table exists but is forgeable and inconsistently written |

### Findings at a glance

| Severity | Count |
|---|---|
| 🔴 Critical | 10 |
| 🟠 High | 9 |
| 🟡 Medium | 10 |
| 🔵 Low | 5 |
| **Total** | **34** |

> **Note on customer login.** You asked me to set aside the customer-login flow because the client considers it acceptable — customers only ever read their own data. I have respected that: no customer-login finding is counted in the Critical/High totals above or in the fix plan. Section 7 records what I saw anyway, because two of those items are not "read-only is fine" issues (one customer can read *another* customer's Aadhaar), and you should be able to accept that risk knowingly rather than by omission.

---

## 2. Critical Vulnerabilities

---

### 🔴 C-01 — Retailer account takeover via unauthorized password reset

| | |
|---|---|
| **File** | `app/api/retailers/route.ts` |
| **Function / lines** | `PATCH`, lines 59–99 (check at 61–62; password reset at 84–87) |
| **CWE** | CWE-862 Missing Authorization · CWE-639 Authorization Bypass Through User-Controlled Key |
| **OWASP** | A01:2021 Broken Access Control |

**Vulnerable code**

```ts
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  //  ^^^ the ONLY check. Any logged-in user of any role passes.

  const body = await req.json();
  const { id, name, password, retail_pin, is_active, mobile } = body;
  ...
  const serviceClient = createServiceClient();          // bypasses RLS
  const { data: retailer } = await serviceClient
    .from('retailers').select('auth_user_id').eq('id', id).single();
  ...
  if (password && retailer.auth_user_id) {
    // Resets the Supabase Auth credential of ANY retailer, by id, for ANY caller
    await serviceClient.auth.admin.updateUserById(retailer.auth_user_id, { password });
  }
```

**Why it is vulnerable.** The handler verifies that *someone* is logged in and never verifies *who*. The `id` in the request body selects which retailer to modify and is entirely attacker-controlled. Because the mutation runs through `createServiceClient()`, the `retailers_admin_all` RLS policy — which would have blocked exactly this — is never consulted. This route is intended to be reachable only from the admin UI (`app/admin/page.tsx:307`), but the UI is not a security boundary; the endpoint is directly callable.

**Attack scenario.** Retailer A logs into their own legitimate account. Retailer B's `id` is not secret — it is returned in admin listings and appears in `retailer_id` fields throughout the API. Retailer A sends a `PATCH` to `/api/retailers` naming B's id and a password of their choosing. Supabase Auth rewrites B's credential. Retailer A now logs in as Retailer B and has full access to B's entire customer book, payment history, and collection reporting. B is simultaneously locked out of their own account, and the portal has no audit-log entry for the change.

**Impact.** Complete horizontal privilege escalation across every tenant on the platform. One compromised or malicious retailer account yields all retailer accounts. Combined with C-03, an attacker can also grant themselves fresh accounts. There is no detection path: `audit_log` is not written by this route.

**Secure fix.** Gate the entire route on `super_admin`, and centralise that check so it cannot be forgotten again. The codebase already has the right pattern in `app/api/admin/payments/[id]/route.ts:5–12`; promote it to a shared helper.

Create `lib/auth.ts`:

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type Actor = { userId: string; role: 'super_admin' | 'retailer'; retailerId: string | null };

/**
 * Resolves the caller's identity and role from the session cookie.
 * Returns a NextResponse to short-circuit on failure, never a partial actor.
 */
export async function requireRole(
  allowed: Array<'super_admin' | 'retailer'>,
): Promise<{ actor: Actor } | { error: NextResponse }> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  // Read the role through the ANON client so RLS (profiles_self) still applies.
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single();

  const role = profile?.role as Actor['role'] | undefined;
  if (!role || !allowed.includes(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  let retailerId: string | null = null;
  if (role === 'retailer') {
    const { data: r } = await supabase
      .from('retailers').select('id, is_active').eq('auth_user_id', user.id).single();
    // Deactivated retailers lose access immediately (see H-08).
    if (!r?.is_active) {
      return { error: NextResponse.json({ error: 'Account inactive' }, { status: 403 }) };
    }
    retailerId = r.id;
  }

  return { actor: { userId: user.id, role, retailerId } };
}
```

Replacement for `PATCH`:

```ts
import { requireRole } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(['super_admin']);      // ← admin only
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const body = await req.json().catch(() => ({}));
  const { id, name, password, retail_pin, is_active, mobile } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (mobile && !/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ error: 'Mobile must be exactly 10 digits' }, { status: 400 });
  }
  if (password !== undefined && String(password).length < 12) {
    return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: retailer } = await serviceClient
    .from('retailers').select('auth_user_id').eq('id', id).single();
  if (!retailer) return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });

  if (password && retailer.auth_user_id) {
    const { error } = await serviceClient.auth.admin
      .updateUserById(retailer.auth_user_id, { password });
    if (error) return NextResponse.json({ error: 'Could not update credential' }, { status: 500 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name       !== undefined) updates.name       = name;
  if (retail_pin !== undefined) updates.retail_pin = retail_pin;
  if (is_active  !== undefined) updates.is_active  = is_active;
  if (mobile     !== undefined) updates.mobile     = mobile || null;

  const { error: dbErr } = await serviceClient.from('retailers').update(updates).eq('id', id);
  if (dbErr) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  // Credential and status changes are security events — always audit them.
  await serviceClient.from('audit_log').insert({
    actor_user_id: actor.userId,
    actor_role: 'super_admin',
    action: password ? 'RETAILER_PASSWORD_RESET' : 'RETAILER_UPDATE',
    table_name: 'retailers',
    record_id: id,
    after_data: { ...updates, password: password ? '[redacted]' : undefined },
  });

  return NextResponse.json({ success: true });
}
```

**Why the new code is secure.** Role is derived server-side from the session cookie, never from the request body. `requireRole` fails closed on a missing profile or an unexpected role. The admin-only gate means the attacker-controlled `id` can now only be exercised by a principal already authorized over every retailer. Password length is validated, the raw DB error is no longer echoed back (M-05), and every credential change lands in `audit_log`.

**Best practice.** Authorization belongs in one shared, tested helper invoked as the first statement of every handler — never re-implemented per route. Treat "is authenticated" and "is authorized" as two distinct questions; the former is table stakes.

**Fully fixed after change:** ✅ Yes — for this route. The class of bug is only fully closed once C-02, C-03 and C-04 through C-07 apply the same helper.

---

### 🔴 C-02 — Retailer deletion endpoint has no authorization check at all

| | |
|---|---|
| **File** | `app/api/retailers/route.ts` |
| **Function / lines** | `DELETE`, lines 101–121 |
| **CWE** | CWE-306 Missing Authentication for Critical Function |
| **OWASP** | A01:2021 Broken Access Control |

**Vulnerable code**

```ts
export async function DELETE(req: NextRequest) {
  const serviceClient = createServiceClient();     // ← no getUser(), no role check, nothing
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { count } = await serviceClient.from('customers')
    .select('*', { count: 'exact', head: true }).eq('retailer_id', id);
  if (count && count > 0) {
    return NextResponse.json({ error: `Cannot delete: ${count} customer(s)...` }, { status: 409 });
  }

  const { data: r } = await serviceClient.from('retailers').select('auth_user_id').eq('id', id).single();
  const { error } = await serviceClient.from('retailers').delete().eq('id', id);
  ...
  if (r?.auth_user_id) await serviceClient.auth.admin.deleteUser(r.auth_user_id);  // destroys the login
```

**Why it is vulnerable.** Unlike its sibling `POST` and `PATCH`, this handler does not call `supabase.auth.getUser()` even once. Its only protection is `middleware.ts`, which requires *a* session for any path outside the public list — so today the bar is "hold any valid login of any role". That is already broken authorization. It becomes total exposure under C-08 (CVE-2025-29927), which lets an attacker skip middleware entirely and reach this handler **completely unauthenticated from the internet**.

The `count > 0` guard is a data-integrity check, not a security control: it only protects retailers who currently have customers. A newly provisioned retailer, or one whose customers were reassigned, is deletable.

**Attack scenario.** With any retailer login (or, under C-08, with none at all), an attacker enumerates retailer ids — freely available from `/api/report/profit` under C-05 — and issues `DELETE /api/retailers?id=<victim>` for each retailer holding zero customers. Each call destroys the `retailers` row *and* calls `auth.admin.deleteUser`, permanently deleting the Supabase Auth identity. The victim can never log in again, and the deletion is not recorded in `audit_log`.

**Impact.** Destructive, irreversible denial of service against tenants, and permanent loss of the auth identity that `customers.retailer_id` and `payment_requests.retailer_id` reference. No audit trail identifies who did it.

**Secure fix.**

```ts
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(['super_admin']);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const serviceClient = createServiceClient();

  // Referential guard — retained, but it is an integrity check, not a security one.
  const { count } = await serviceClient
    .from('customers').select('*', { count: 'exact', head: true }).eq('retailer_id', id);
  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} customer(s) assigned to this retailer.` },
      { status: 409 },
    );
  }

  const { data: r } = await serviceClient
    .from('retailers').select('auth_user_id, name, username').eq('id', id).single();
  if (!r) return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });

  // Write the audit record BEFORE the destructive step, so a partial failure
  // still leaves evidence of the attempt.
  await serviceClient.from('audit_log').insert({
    actor_user_id: actor.userId,
    actor_role: 'super_admin',
    action: 'RETAILER_DELETE',
    table_name: 'retailers',
    record_id: id,
    before_data: { name: r.name, username: r.username },
  });

  const { error } = await serviceClient.from('retailers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

  if (r.auth_user_id) await serviceClient.auth.admin.deleteUser(r.auth_user_id);
  return NextResponse.json({ success: true });
}
```

**Why the new code is secure.** The destructive path is unreachable without a verified `super_admin` session established inside the handler, so it no longer depends on middleware for its only defence — it stays safe even if middleware is bypassed. Evidence is recorded before the irreversible action.

**Best practice.** Never let a route's only authorization live in middleware. Middleware is defence-in-depth; the handler is the boundary. Destructive endpoints should additionally require a confirmation token or soft-delete.

**Fully fixed after change:** ✅ Yes.

---

### 🔴 C-03 — Any authenticated user can create retailer accounts

| | |
|---|---|
| **File** | `app/api/retailers/route.ts` |
| **Function / lines** | `POST`, lines 4–57 (check at 6–7) |
| **CWE** | CWE-862 Missing Authorization · CWE-269 Improper Privilege Management |
| **OWASP** | A01:2021 Broken Access Control |

**Why it is vulnerable.** Identical defect to C-01: `if (!user)` and nothing more. The handler then calls `serviceClient.auth.admin.createUser(...)` and inserts a `profiles` row with `role: 'retailer'` (line 54). A caller who should have no administrative capability can therefore mint new authenticated principals.

**Attack scenario.** A retailer whose account is about to be revoked calls `POST /api/retailers` with a username and password of their choosing. They receive a brand-new, fully functional retailer login with `is_active: true` that the admin never provisioned and is unlikely to notice among legitimate rows. This becomes a durable backdoor that survives deactivation of the original account, and a staging point for C-01 (from the new account, reset every other retailer's password).

**Impact.** Persistence and privilege escalation. Unbounded account creation is also an availability and cost problem against the Supabase Auth user quota.

**Secure fix.** Apply the same gate, plus input validation the current code lacks:

```ts
import { z } from 'zod';                        // already a dependency
import { requireRole } from '@/lib/auth';

const CreateRetailer = z.object({
  name:       z.string().trim().min(1).max(120),
  username:   z.string().trim().regex(/^[a-z0-9_]{3,32}$/i, 'letters, digits, underscore only'),
  password:   z.string().min(12).max(128),
  retail_pin: z.string().regex(/^\d{4,6}$/).optional(),
  mobile:     z.string().regex(/^\d{10}$/).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(['super_admin']);
  if ('error' in auth) return auth.error;

  const parsed = CreateRetailer.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
  }
  const { name, username, password, retail_pin, mobile } = parsed.data;

  const serviceClient = createServiceClient();
  const email = `${username.toLowerCase()}@tele.local`;

  const { data: authUser, error: authErr } = await serviceClient.auth.admin.createUser({
    email, password, email_confirm: true,           // never fall back to the PIN
  });
  if (authErr || !authUser?.user) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  const { data: retailer, error: dbErr } = await serviceClient.from('retailers').insert({
    auth_user_id: authUser.user.id,
    name, username: username.toLowerCase(),
    retail_pin: retail_pin ?? null, mobile: mobile ?? null, is_active: true,
  }).select().single();

  if (dbErr) {
    await serviceClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'Failed to create retailer' }, { status: 500 });
  }

  await serviceClient.from('profiles').insert({ user_id: authUser.user.id, role: 'retailer' });
  return NextResponse.json({ retailer });
}
```

**Why the new code is secure.** Only a `super_admin` can create principals. `zod` enforces a username charset (preventing crafted `@tele.local` addresses that could collide with the admin `@admin.local` namespace) and a 12-character minimum password. The `password || retail_pin` fallback is removed, so a 4-digit PIN can never silently become a login credential.

**Best practice.** Account provisioning is an administrative capability; validate and constrain it as strictly as any other. Never let a low-entropy secondary factor (a PIN) double as a primary credential.

**Fully fixed after change:** ✅ Yes.

---

### 🔴 C-04 — Full cross-tenant customer dump via `/api/report/customer-profit`

| | |
|---|---|
| **File** | `app/api/report/customer-profit/route.ts` |
| **Function / lines** | `GET`, lines 4–25 (check at 6–7; unscoped query at 9) |
| **CWE** | CWE-639 Authorization Bypass Through User-Controlled Key · CWE-200 Information Exposure |
| **OWASP** | A01:2021 Broken Access Control |

**Vulnerable code**

```ts
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //  ^^^ no role check, no retailer scoping

  const svc = createServiceClient();               // ← RLS bypassed
  const { data: customers } = await svc.from('customers').select(
    'id, customer_name, imei, mobile, purchase_value, down_payment, disburse_amount, ' +
    'emi_amount, emi_tenure, first_emi_charge_amount, ..., retailer:retailers(name)'
  ).order('customer_name');                        // ← NO .eq('retailer_id', ...)
```

**Why it is vulnerable.** The query has no tenant filter whatsoever, and the service-role client means `customers_retailer_own` — the RLS policy written precisely to enforce `retailer_id = get_my_retailer_id()` — is never evaluated. Every row in the `customers` table is selected, joined to its retailer's name, and streamed back as a CSV attachment. The contrast with `app/api/retailer/dashboard/route.ts:110–120`, which does this correctly, shows the intended pattern was simply not applied here.

**Attack scenario.** A retailer opens their own portal, and requests `GET /api/report/customer-profit`. They receive `Customer_Wise_Profit.csv` containing every customer of every competing retailer on the platform: full name, mobile number, device IMEI, purchase value, down payment, disbursed amount, total collected, and per-customer profit margin — with the owning retailer's name in column 1. No parameter tampering is required; the endpoint simply returns everything.

**Impact.** Catastrophic and total breach of tenant isolation. This is a complete competitor-intelligence dump (every rival's book, margins, and customer list) and a mass PII disclosure under India's DPDP Act 2023 — names, mobile numbers and device identifiers of every borrower on the platform. It is silent, requires no special tooling, and leaves no audit record.

**Secure fix.** Scope the query to the caller, using the pattern already proven in the retailer routes, and stop hand-rolling CSV (see M-01/M-02):

```ts
import { requireRole } from '@/lib/auth';
import { buildCsv, csvHeaders } from '@/lib/csv';
import { fetchAllPaged } from '@/lib/dbFetch';
import { firstChargePaid } from '@/lib/firstCharge';

export async function GET(req: NextRequest) {
  const auth = await requireRole(['super_admin', 'retailer']);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  // Admins may target one retailer; retailers are pinned to their own id.
  const requested = req.nextUrl.searchParams.get('retailer_id');
  const retailerId = actor.role === 'retailer' ? actor.retailerId : requested;

  const svc = createServiceClient();

  const customers = await fetchAllPaged<CustomerRow>((from, to) => {
    let q = svc.from('customers')
      .select('id, customer_name, imei, mobile, purchase_value, down_payment, ' +
              'disburse_amount, emi_amount, emi_tenure, first_emi_charge_amount, ' +
              'first_emi_charge_paid_amount, first_emi_charge_paid_at, status, ' +
              'retailer:retailers(name)')
      .order('id').range(from, to);
    if (retailerId) q = q.eq('retailer_id', retailerId);   // ← the fix
    return q as never;
  });

  const rows = [];
  for (const c of customers) {
    const { data: emis } = await svc.from('emi_schedule')
      .select('status, amount, fine_amount, fine_paid_amount').eq('customer_id', c.id);
    ...
    rows.push({ Retailer: rn, Customer: c.customer_name, IMEI: c.imei, /* … */ });
  }

  return new NextResponse(buildCsv({ header: HEADER, rows }),
                          { headers: csvHeaders('Customer_Wise_Profit.csv') });
}
```

**Why the new code is secure.** A retailer's `retailerId` comes from `requireRole`, resolved server-side from their session's `auth_user_id` — it is not readable or writable from the request, so `?retailer_id=` tampering is inert for them. An admin retains the drill-down. Routing through `buildCsv` also removes the injection issues in M-01/M-02.

**Best practice.** When a handler uses the service-role client, treat every query as if RLS did not exist — because it does not. A useful rule: *every* `svc.from('customers'|'emi_schedule'|'payment_requests')` call must carry a tenant predicate derived from the session, and that should be enforced in code review or by a lint rule.

**Fully fixed after change:** ✅ Yes.

---

### 🔴 C-05 — Cross-tenant overdue-debtor dump via `/api/report/fine-due`

| | |
|---|---|
| **File** | `app/api/report/fine-due/route.ts` |
| **Function / lines** | `GET`, lines 3–25 (check at 5–6; unscoped query at 8) |
| **CWE** | CWE-639 · CWE-200 | **OWASP** | A01:2021 |

**Vulnerable code**

```ts
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const svc = createServiceClient();
const { data: emis } = await svc.from('emi_schedule')
  .select('emi_no, due_date, amount, fine_amount, fine_paid_amount, fine_waived, ' +
          'customer:customers(customer_name, imei, mobile, retailer:retailers(name))')
  .gt('fine_amount', 0).eq('fine_waived', false).order('due_date');   // every retailer
```

**Why it is vulnerable.** Same defect as C-04 — authentication without authorization, no tenant predicate, service-role client. The only filters are business filters (`fine_amount > 0`, not waived).

**Attack scenario.** Any retailer requests the endpoint and receives `Fine_Due_Report.csv` — a platform-wide list of *every borrower in arrears*: retailer name, customer name, IMEI, mobile number, amount owed, and days overdue. This is the single most commercially sensitive and most personally damaging dataset in the system.

**Impact.** Mass disclosure of financial-distress data tied to named individuals and their phone numbers. Beyond the competitive harm (a rival's entire delinquent book, ready-made for poaching or harassment), a list of overdue borrowers with contact details is directly usable for predatory lending and targeted fraud. Under the DPDP Act this is sensitive personal data processed without any lawful access control.

**Secure fix.** Same shape as C-04 — resolve scope from the session, then constrain the query. Because the tenant key lives on `customers`, not `emi_schedule`, filter by customer id:

```ts
export async function GET(req: NextRequest) {
  const auth = await requireRole(['super_admin', 'retailer']);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const requested  = req.nextUrl.searchParams.get('retailer_id');
  const retailerId = actor.role === 'retailer' ? actor.retailerId : requested;

  const svc = createServiceClient();

  // Resolve the in-scope customer set first, then filter EMIs by it.
  let custQuery = svc.from('customers').select('id');
  if (retailerId) custQuery = custQuery.eq('retailer_id', retailerId);
  const { data: scopedCustomers } = await custQuery;
  const customerIds = (scopedCustomers ?? []).map(c => c.id);
  if (!customerIds.length) {
    return new NextResponse(buildCsv({ header: HEADER, rows: [] }),
                            { headers: csvHeaders('Fine_Due_Report.csv') });
  }

  const emis = await fetchAllByIds<EmiRow>(customerIds, (chunk, from, to) =>
    svc.from('emi_schedule')
      .select('emi_no, due_date, amount, fine_amount, fine_paid_amount, fine_waived, ' +
              'customer:customers(customer_name, imei, mobile, retailer:retailers(name))')
      .in('customer_id', chunk)                       // ← tenant-scoped
      .gt('fine_amount', 0).eq('fine_waived', false)
      .order('id').range(from, to) as never,
  );
  ...
}
```

**Why the new code is secure.** The customer id set is derived from a session-bound `retailer_id`, so an EMI row belonging to another tenant can never enter the result. `fetchAllByIds` (the repo's existing helper) keeps the id list chunked below PostgREST's URL limit, so the fix does not reintroduce the row-loss bug that helper was written to solve.

**Best practice.** For tables that carry the tenant key only transitively, resolve the owning-entity id set explicitly rather than relying on a join filter — joins in PostgREST filter the *embedded* resource, not the parent rows, which is a classic source of silent over-disclosure.

**Fully fixed after change:** ✅ Yes.

---

### 🔴 C-06 — Cross-tenant financial P&L disclosure via `/api/report/profit`

| | |
|---|---|
| **File** | `app/api/report/profit/route.ts` |
| **Function / lines** | `GET`, lines 3–48 (check at 5–6; unscoped retailer loop at 12–43) |
| **CWE** | CWE-639 · CWE-200 | **OWASP** | A01:2021 |

**Vulnerable code**

```ts
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const svc = createServiceClient();
...
const { data: retailers } = await svc.from('retailers')
  .select('id, name').eq('is_active', true).order('name');    // ← every retailer
for (const r of retailers || []) {
  const { data: custs }    = await svc.from('customers').select(...).eq('retailer_id', r.id);
  const { data: payments } = await svc.from('payment_requests').select(...).eq('retailer_id', r.id);
  // …computes realized + projected profit per retailer…
}
```

**Why it is vulnerable.** The handler deliberately iterates *all* active retailers with no notion of caller scope. The per-iteration `.eq('retailer_id', r.id)` filters are loop bookkeeping, not access control.

**Attack scenario.** Any retailer requests `GET /api/report/profit?month=&year=` and receives a CSV with one row per competitor: total purchase value, total down payments, total disbursed, EMI collected, fines collected, first-charge revenue, total revenue, realized profit and projected profit — plus a platform-wide `TOTAL`. Iterating the `month`/`year` parameters reconstructs the complete financial history of every business on the platform.

**Impact.** Total disclosure of every tenant's commercial performance, and of the platform operator's aggregate book. Directly exploitable for competitive advantage; in a franchise arrangement it also exposes the operator's own margins to their franchisees.

**Secure fix.** Restrict the retailer set to the caller's scope:

```ts
export async function GET(req: NextRequest) {
  const auth = await requireRole(['super_admin', 'retailer']);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const svc = createServiceClient();

  // Admin: all active retailers (optionally one). Retailer: strictly self.
  let retailers: { id: string; name: string }[] = [];
  if (actor.role === 'super_admin') {
    const requested = req.nextUrl.searchParams.get('retailer_id');
    let q = svc.from('retailers').select('id, name').eq('is_active', true).order('name');
    if (requested) q = q.eq('id', requested);
    retailers = (await q).data ?? [];
  } else {
    const { data: self } = await svc.from('retailers')
      .select('id, name').eq('id', actor.retailerId!).single();
    retailers = self ? [self] : [];
  }

  // Validate the period instead of trusting parseInt (see M-07).
  const now = new Date();
  const m = Number(req.nextUrl.searchParams.get('month')) || now.getMonth() + 1;
  const y = Number(req.nextUrl.searchParams.get('year'))  || now.getFullYear();
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2020 || y > 2099) {
    return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
  }
  ...
  // The platform-wide TOTAL row is meaningful only for an admin.
  if (actor.role === 'super_admin') rows.push(['TOTAL', /* … */]);
}
```

**Why the new code is secure.** The `retailers` array — which drives the entire report — is built from the caller's own id when the caller is a retailer, so the loop can only ever traverse their own data. The aggregate `TOTAL` row is suppressed for non-admins, closing the inference channel that would otherwise leak platform-wide figures even from a correctly scoped single-row report.

**Best practice.** In multi-tenant reporting, scope the *iteration set*, not just the inner queries — and remember that aggregates and totals leak information about rows the caller cannot see.

**Fully fixed after change:** ✅ Yes.

---

### 🔴 C-07 — Cross-tenant PII theft via unbounded customer-app token minting

| | |
|---|---|
| **File** | `app/api/customer-app-token/route.ts` |
| **Function / lines** | `POST` lines 5–33 (missing ownership check at 18–19); `GET` lines 36–95 |
| **CWE** | CWE-639 Authorization Bypass Through User-Controlled Key · CWE-863 Incorrect Authorization |
| **OWASP** | A01:2021 Broken Access Control |

**Vulnerable code**

```ts
export async function POST(req: NextRequest) {
  ...
  if (profile?.role !== 'super_admin' && profile?.role !== 'retailer')
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  //  ^ role is checked — but NOT whether this customer belongs to this retailer

  const { customer_id } = await req.json();
  const svc = createServiceClient();
  const { data: customer } = await svc.from('customers')
    .select('id, customer_name, mobile').eq('id', customer_id).single();   // any customer
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
  // upsert → one permanent, non-expiring token for that customer
  return NextResponse.json({ token, customer_name: customer.customer_name, mobile: customer.mobile });
}
```

**Why it is vulnerable.** The route correctly verifies that the caller holds *a* privileged role, then omits the ownership predicate — it never asks whether `customer_id` belongs to the calling retailer. Because it runs on the service-role client, `customers_retailer_own` never fires. The minted token is then a bearer credential that `GET` exchanges for the customer's **complete** record, including `aadhaar` (line 55) and full loan history, with no further authorization.

Two aggravating properties: the token is written by upsert, so minting one **invalidates the legitimate customer's existing token** (a side-channel denial of service against that customer's app), and no expiry is stored or checked — `GET` validates only `is_active`, so the credential is permanent.

**Attack scenario.** Retailer A obtains a competitor's customer ids (trivially, via C-04 or C-05, both of which return `id`). For each, A calls `POST /api/customer-app-token` and receives a token. A then calls `GET /api/customer-app-token?token=…` — an endpoint with no session requirement at all — and receives that customer's full profile: Aadhaar number, father's name, both alternate phone numbers, address-grade identifiers, IMEI, device lock state, and the entire EMI schedule. Repeating across the id list exfiltrates the platform's complete PII store, and every token remains valid indefinitely.

**Impact.** Mass theft of government identity numbers (Aadhaar) — the highest-severity data class in the system, with direct identity-fraud value and specific statutory protection under the Aadhaar Act and DPDP Act 2023. The permanence of the tokens means revoking the attacker's retailer account does not revoke their access.

**Secure fix.** Enforce ownership on mint, and make tokens expiring and revocable:

```ts
export async function POST(req: NextRequest) {
  const auth = await requireRole(['super_admin', 'retailer']);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const { customer_id } = await req.json().catch(() => ({}));
  if (!customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 });

  const svc = createServiceClient();

  // ── OWNERSHIP CHECK ──────────────────────────────────────────────────────
  let q = svc.from('customers').select('id, customer_name, mobile, retailer_id').eq('id', customer_id);
  if (actor.role === 'retailer') q = q.eq('retailer_id', actor.retailerId!);   // ← the fix
  const { data: customer } = await q.single();
  // Same 404 whether the customer is absent or foreign — no existence oracle.
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();  // 30 days

  await svc.from('customer_app_tokens').upsert(
    { customer_id, token, created_by: actor.userId, expires_at: expiresAt,
      is_active: true, updated_at: new Date().toISOString() },
    { onConflict: 'customer_id' },
  );

  await svc.from('audit_log').insert({
    actor_user_id: actor.userId, actor_role: actor.role,
    action: 'CUSTOMER_TOKEN_ISSUED', table_name: 'customer_app_tokens', record_id: customer_id,
  });

  return NextResponse.json({ token, customer_name: customer.customer_name, expires_at: expiresAt });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const svc = createServiceClient();
  const { data: tokenRow } = await svc.from('customer_app_tokens')
    .select('customer_id, is_active, expires_at').eq('token', token).maybeSingle();

  // Enforce expiry, not just the active flag.
  if (!tokenRow || !tokenRow.is_active ||
      (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date())) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  ...
}
```

Accompanying migration:

```sql
ALTER TABLE customer_app_tokens
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Existing non-expiring tokens are credentials of unknown provenance: expire them.
UPDATE customer_app_tokens
   SET expires_at = NOW() + INTERVAL '7 days'
 WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cat_token ON customer_app_tokens (token);
```

**Why the new code is secure.** The `.eq('retailer_id', actor.retailerId)` predicate makes a foreign `customer_id` return zero rows, so a retailer cannot mint a credential for a customer they do not own — and the uniform 404 avoids confirming whether the id exists. Doubling the token to 64 hex chars raises entropy well beyond the guessable `Date.now()`-suffixed original. Expiry bounds the damage of any leaked token, and issuance is now audited.

**Best practice.** A role check answers "may this kind of user do this kind of thing"; it never answers "may *this* user act on *this* object". Both are required. Bearer tokens must always carry an expiry and a revocation path.

**Fully fixed after change:** ✅ Yes for the cross-tenant minting. Note H-04 (token in query string) is a separate, still-open issue for the `GET` side.

---

### 🔴 C-08 — Framework CVE: Next.js middleware authorization bypass (CVE-2025-29927)

| | |
|---|---|
| **File** | `package.json:24`, `package-lock.json:2020–2024`, exploited against `middleware.ts` |
| **Version** | `next@14.2.16` (patched in 14.2.25 for this CVE) |
| **CWE** | CWE-863 Incorrect Authorization | **OWASP** | A06:2021 Vulnerable Components |

**Evidence — the lockfile flags itself:**

```json
"node_modules/next": {
  "version": "14.2.16",
  "resolved": "https://registry.npmjs.org/next/-/next-14.2.16.tgz",
  "deprecated": "This version has a security vulnerability. Please upgrade to a patched
                 version. See https://nextjs.org/blog/security-update-2025-12-11 ...",
```

**Why it is vulnerable.** CVE-2025-29927 allows a request carrying a specific internal Next.js header to be treated as an already-processed internal subrequest, causing the middleware chain to be skipped entirely. The lockfile additionally records a *second*, later advisory (December 2025) against this exact version. `middleware.ts` is this application's session gate for every non-public path — so skipping it removes the authentication check for every route that does not repeat that check internally.

**Attack scenario.** The routes that rely on middleware alone become reachable with no session at all:

- **`DELETE /api/retailers`** (C-02) — no in-handler auth → unauthenticated destruction of retailer accounts from the open internet.
- **`GET /api/settlement-letter/[id]`** (H-01) — no in-handler auth → unauthenticated enumeration of settled customers' PII.
- **`/admin` and `/retailer` pages** — the role redirects in `middleware.ts:56–68` are the only enforcement of who may load which dashboard.

Everything that *does* call `getUser()` internally (the payment routes, the admin routes) remains protected — which is precisely why C-01…C-07 must be fixed independently of this upgrade.

**Impact.** Converts several already-broken-authorization findings from "any logged-in user" into "anyone on the internet." Highest-leverage single fix in this report.

**Secure fix.**

```bash
# Upgrade within the 14.2.x line (no breaking changes) to the latest patch:
npm install next@^14.2.25          # minimum for CVE-2025-29927
npm audit fix
npm audit --omit=dev               # confirm clean
```

Then verify the resolved version really moved — a stale lockfile silently defeats this:

```bash
node -e "console.log(require('next/package.json').version)"
```

Because the December 2025 advisory referenced in the lockfile post-dates the CVE-2025-29927 patch, install the **latest available 14.2.x release**, not merely 14.2.25, and re-run `npm audit` to confirm the deprecation notice is gone. Add a CI gate so this cannot regress:

```yaml
# .github/workflows/audit.yml
name: Dependency audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm audit --audit-level=high --omit=dev
```

**Defence in depth (do this regardless of the upgrade).** Never let middleware be the only gate. Every finding in this report that says "protected by middleware" should be re-verified after adding `requireRole` to the handler — which C-01 through C-07 already do.

**Best practice.** Pin and monitor the framework; subscribe to the Next.js security feed; treat middleware as advisory routing logic, never as the authorization boundary.

**Fully fixed after change:** ✅ Yes for the CVE, provided the lockfile is regenerated and the handler-level fixes land too.

---

### 🔴 C-09 — RLS `UPDATE` policy missing `WITH CHECK` allows customer ownership transfer and EMI tampering

| | |
|---|---|
| **File** | `supabase/fresh_supabase_schema.sql:836–838` (identically `supabase/existing_supabase_upgrade.sql:526–528`) |
| **CWE** | CWE-863 Incorrect Authorization · CWE-639 |
| **OWASP** | A01:2021 Broken Access Control |

**Vulnerable policy**

```sql
CREATE POLICY "customers_retailer_upd" ON customers FOR UPDATE USING (
  get_my_role() = 'retailer' AND retailer_id = get_my_retailer_id()
);
-- ↑ USING gates which rows may be READ for update.
--   There is NO WITH CHECK, so the row's state AFTER the update is unconstrained.
```

**Why it is vulnerable.** In PostgreSQL RLS, `USING` filters the rows an `UPDATE` may target; `WITH CHECK` validates the resulting row. When `WITH CHECK` is omitted on an `UPDATE` policy, Postgres reuses the `USING` expression *only if no separate check is defined* — and critically, for `UPDATE` the new-row check is not applied unless declared. The practical effect here is that a retailer may take a row they legitimately own and write a **different** `retailer_id` into it, moving the customer into another tenant — or out of their own, hiding it.

This is directly reachable, not theoretical: the frontend performs customer updates from the **browser** with the anon key (`components/CustomerFormModal.tsx:271`, `app/admin/page.tsx:219/235`, `components/PhoneLockBadge.tsx:34`). Those requests go straight to PostgREST under the caller's own JWT, so a retailer can craft an equivalent request with any column set they like.

Beyond `retailer_id`, no policy constrains *which columns* a retailer may change. `purchase_value`, `down_payment`, `disburse_amount`, `emi_amount`, `emi_tenure` and `status` are all writable — and `emi_amount`/`emi_tenure` feed the `fn_generate_emi_schedule()` trigger, so editing them rewrites the loan.

**Attack scenario.** A retailer issues a PostgREST `PATCH` against `customers` for one of their own customer ids, setting `emi_amount` to a fraction of its true value — the EMI schedule regenerates and the borrower's obligation shrinks, with no payment recorded and no `audit_log` entry (the audit trigger, if any, is not defined for this path). Alternatively they set `retailer_id` to a competitor's id, transferring an NPA customer onto a rival's book, or set `status` to `COMPLETE` to make a defaulted loan disappear from collection reporting.

**Impact.** Direct financial-integrity failure: loan values, balances, and ownership are all mutable by the party with an incentive to change them. This is the "manipulate EMI values / change customer ownership / modify totals" business-logic class, confirmed as reachable.

**Secure fix.** Add `WITH CHECK`, and prevent tenant-key rewrites and financial-column edits at the database level:

```sql
-- ── 1. Constrain the post-update row to the same tenant ──────────────────────
DROP POLICY IF EXISTS "customers_retailer_upd" ON customers;
CREATE POLICY "customers_retailer_upd" ON customers
  FOR UPDATE
  USING      (get_my_role() = 'retailer' AND retailer_id = get_my_retailer_id())
  WITH CHECK (get_my_role() = 'retailer' AND retailer_id = get_my_retailer_id());
  --          ^^^^^^^^^^ the row must STILL belong to this retailer afterwards

-- Apply the same treatment to the INSERT policy's sibling tables.
DROP POLICY IF EXISTS "payment_requests_retailer_ins" ON payment_requests;
CREATE POLICY "payment_requests_retailer_ins" ON payment_requests
  FOR INSERT WITH CHECK (get_my_role() = 'retailer' AND retailer_id = get_my_retailer_id());

-- ── 2. Freeze the financial terms of a live loan against non-admin edits ─────
CREATE OR REPLACE FUNCTION fn_guard_customer_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp        -- see H-03
AS $$
BEGIN
  IF get_my_role() = 'super_admin' THEN
    RETURN NEW;                          -- admins may correct data
  END IF;

  IF NEW.retailer_id IS DISTINCT FROM OLD.retailer_id THEN
    RAISE EXCEPTION 'Customer ownership cannot be reassigned';
  END IF;

  IF NEW.purchase_value   IS DISTINCT FROM OLD.purchase_value
  OR NEW.down_payment     IS DISTINCT FROM OLD.down_payment
  OR NEW.disburse_amount  IS DISTINCT FROM OLD.disburse_amount
  OR NEW.emi_amount       IS DISTINCT FROM OLD.emi_amount
  OR NEW.emi_tenure       IS DISTINCT FROM OLD.emi_tenure
  OR NEW.settlement_amount IS DISTINCT FROM OLD.settlement_amount THEN
    RAISE EXCEPTION 'Loan financial terms are immutable; contact an administrator';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_customer_financials ON customers;
CREATE TRIGGER trg_guard_customer_financials
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION fn_guard_customer_financials();
```

**Why the new code is secure.** `WITH CHECK` is evaluated against the *new* row, so an `UPDATE` that would move the row to another `retailer_id` is rejected by the database itself — regardless of which client issued it, including the browser. The trigger then makes the economically meaningful columns immutable for non-admins, so even a correctly scoped retailer cannot rewrite a loan's terms. Both controls live in Postgres, below the API, so they hold for every access path.

**Best practice.** Every `FOR UPDATE` and `FOR ALL` RLS policy needs an explicit `WITH CHECK` — omitting it is the single most common RLS mistake. Treat the tenant key as immutable after insert.

**Fully fixed after change:** ✅ Yes.

---

### 🔴 C-10 — CI workflow is designed to publish the entire customer database to a public repository

| | |
|---|---|
| **File** | `.github/workflows/backup.yml` · `backup/github-backup.mjs:30,66–92` · `backups/README.md` |
| **CWE** | CWE-538 Insertion of Sensitive Information into Externally-Accessible File · CWE-200 |
| **OWASP** | A01:2021 · A05:2021 Security Misconfiguration |
| **Status** | ⚠️ **Latent — not yet triggered.** Verified against full git history: no blob has ever existed under `backups/latest/`. |

**The design**

```yaml
on:
  schedule:
    - cron: '0 */12 * * *'
permissions:
  contents: write
...
      - name: Pull database into backups/
        env:
          PORTAL_URL:   ${{ secrets.PORTAL_URL }}
          BACKUP_TOKEN: ${{ secrets.BACKUP_TOKEN }}
        run: node backup/github-backup.mjs
      - name: Commit snapshot if it changed
        run: |
          git add backups/       # ← commits the dump into the repository
```

`backup/github-backup.mjs:30` writes to `OUT_DIR = backups/latest`, and `backups/README.md` states plainly: *"`latest/<table>.json` — every row of each table as JSON (full, exact copy)"*, covering `customers`, `profiles`, `customer_app_tokens`, `audit_log` and every other table. `.gitignore` does **not** exclude `backups/`.

**Why it is vulnerable.** `biswajitkhanra/telepoint` is a **public** GitHub repository. The workflow commits a complete database dump into it on a 12-hourly schedule. The `customers` table contains `aadhaar`, `mobile`, `father_name`, `imei` and full financial terms; `customer_app_tokens` contains live bearer credentials (C-07). Git history is append-only — once pushed, a later deletion does not remove the data, and forks and clones retain it permanently.

**Attack scenario.** No attack is required; the platform publishes the data itself. The moment an operator follows `backup/README.md` and adds the `PORTAL_URL` and `BACKUP_TOKEN` repository secrets, the next scheduled run commits every borrower's Aadhaar number, phone number and loan history to a world-readable URL, indexed by search engines and mirrored by GitHub's public event firehose. Anyone who has ever forked the repository receives the data too.

**Impact.** Would constitute a complete, irreversible, public breach of every data subject on the platform — the single highest-impact item in this report despite being currently unexploited. Aadhaar disclosure carries statutory penalties under the Aadhaar Act and the DPDP Act 2023, and the permanence of git history means there is no effective remediation after the fact.

**Secure fix — do all four:**

1. **Never commit backups to git.** Send them to private object storage with server-side encryption instead:

```yaml
# .github/workflows/backup.yml — replace the commit step entirely
permissions:
  contents: read                      # ← no write access needed any more

      - name: Pull database and upload to private storage
        env:
          PORTAL_URL:            ${{ secrets.PORTAL_URL }}
          BACKUP_TOKEN:          ${{ secrets.BACKUP_TOKEN }}
          AWS_ACCESS_KEY_ID:     ${{ secrets.BACKUP_S3_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_S3_SECRET }}
        run: |
          node backup/github-backup.mjs
          aws s3 sync backups/latest "s3://$BACKUP_BUCKET/$(date -u +%Y-%m-%dT%H)" \
              --sse AES256 --acl private
          rm -rf backups/latest       # never leave the dump in the workspace
```

2. **Fail closed in `.gitignore`,** so an accidental `git add` cannot reintroduce it:

```gitignore
# Database snapshots — MUST NEVER be committed (contains Aadhaar + PII)
/backups/latest/
/backups/backup-manifest.json
*.dump
*.sql.gz
```

3. **Make the repository private**, or move the portal source into a private repository. A public repository is not an appropriate home for a lending platform's operational tooling.

4. **Minimise the dump.** `backup/github-backup.mjs` should exclude or hash `aadhaar` and `customer_app_tokens.token` outright — a restore-oriented backup rarely needs live bearer tokens.

**Verification before deploying:**

```bash
# Confirm no snapshot has ever been committed (currently: clean)
git log --all --diff-filter=A --name-only --pretty=format: -- 'backups/latest/*' | sort -u
# Confirm the secrets are not configured on the repo
gh secret list
```

**Best practice.** Backups inherit the classification of the data they contain and must be at least as protected as production. CI artifacts are not a storage tier. Never grant `contents: write` to a workflow that handles production data.

**Fully fixed after change:** ✅ Yes — and while the risk is currently unrealized, this should be remediated **before** any backup secret is configured.

---

## 3. High Vulnerabilities

### 🟠 H-01 — Stored XSS and IDOR in server-rendered receipt and settlement-letter pages

| | |
|---|---|
| **Files** | `app/api/receipt/[id]/route.ts:120–214` · `app/api/settlement-letter/[id]/route.ts:16–94` |
| **CWE** | CWE-79 Cross-site Scripting · CWE-639 IDOR | **OWASP** | A03:2021 Injection · A01:2021 |

**Vulnerable code** (receipt route — the settlement letter is structurally identical):

```ts
const photoUrl = ibbDirect(customer?.customer_photo_url ?? '');
const photoHtml = photoUrl
  ? `<img src="${photoUrl}" ... onerror="this.style.display='none';..." />`   // attribute injection
  : `<div ...>No<br>Photo</div>`;

const html = `<!DOCTYPE html> ...
  <p style="font-weight:700;">${customer?.customer_name ?? '—'}</p>          // unescaped
  <p ...>${retailer?.name ?? '—'}</p>                                        // unescaped
  ${request.utr ? `<span ...>${request.utr}</span>` : ''}                    // unescaped
  ${request.rejection_reason ? `<p ...>${request.rejection_reason}</p>` : ''} // unescaped
`;
return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
```

**Why it is vulnerable.** Both routes build raw HTML by string interpolation of database-controlled values and serve it as `text/html` on the application's own origin. None of `customer_name`, `retailer.name`, `utr`, `rejection_reason`, `father_name`, `model_no` or `imei` is escaped. `customer_photo_url` is interpolated **inside a quoted attribute**, so a value containing a double quote breaks out of `src` and injects arbitrary attributes — including event handlers.

The repository already contains the correct helper, unused here — `lib/loanStatementHtml.ts:84` escapes `& < > "` properly. This is an inconsistency, not a missing capability.

Separately, both routes are IDOR: `/api/receipt/[id]` is on the middleware **public** list (`middleware.ts:7`) and performs no authorization at all, so any receipt is readable by anyone who knows or guesses its UUID. `/api/settlement-letter/[id]` performs no check inside the handler either, so any logged-in retailer can read any settled customer's letter — including full name, father's name, mobile, IMEI and settlement amount — and under C-08 it is reachable unauthenticated.

**Attack scenario.** A retailer creates a customer whose `customer_name` contains an HTML `<script>` element, or sets a crafted `customer_photo_url` with an embedded event handler. When an administrator later opens that customer's receipt to verify a payment, the injected script executes on the portal's origin in the admin's browser. There is no CSP to stop it (H-05) and no `HttpOnly` barrier that helps, because the script can simply act *as* the admin: call `/api/payments/approve`, `/api/settlement`, or `/api/retailers` with the admin's cookies attached.

**Impact.** Stored XSS escalating a retailer to super-admin capability — the highest-value target in the system — plus unauthenticated disclosure of receipts and settled-customer PII.

**Secure fix.** Escape every interpolation and add authorization. Promote the existing escaper to a shared module:

```ts
// lib/html.ts
/** Escapes a value for safe interpolation into HTML text or a quoted attribute. */
export function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Only http(s) URLs survive; anything else becomes empty. Blocks javascript:/data:. */
export function safeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.toString() : '';
  } catch { return ''; }
}
```

Then in `app/api/receipt/[id]/route.ts`:

```ts
import { esc, safeUrl } from '@/lib/html';
import { requireRole } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // Receipts identify a real person and a real payment — require a session.
  const auth = await requireRole(['super_admin', 'retailer']);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const serviceClient = createServiceClient();
  let q = serviceClient.from('payment_requests').select(`...`).eq('id', params.id);
  if (actor.role === 'retailer') q = q.eq('retailer_id', actor.retailerId!);   // tenant scope
  const { data: request, error } = await q.single();
  if (error || !request) return new NextResponse('Receipt not found', { status: 404 });

  const photoUrl = safeUrl(ibbDirect(customer?.customer_photo_url ?? ''));
  const photoHtml = photoUrl
    ? `<img src="${esc(photoUrl)}" alt="Customer Photo" style="..." />`
    : `<div style="...">No<br>Photo</div>`;

  const html = `<!DOCTYPE html> ...
    <p style="font-weight:700;">${esc(customer?.customer_name) || '—'}</p>
    <p>${esc(retailer?.name) || '—'}</p>
    ${request.utr ? `<span>${esc(request.utr)}</span>` : ''}
    ${request.rejection_reason ? `<p>${esc(request.rejection_reason)}</p>` : ''}
  `;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
```

Apply the same `requireRole` + `esc()` treatment to `app/api/settlement-letter/[id]/route.ts`, and remove `/receipt` and `/api/receipt` from the middleware public list.

**Why the new code is secure.** `esc()` neutralises the characters that let a value escape its text node or attribute, so database content can no longer become markup. `safeUrl()` restricts the image source to `http(s)`, blocking `javascript:` and `data:` payloads. The per-response CSP (`default-src 'none'`) means that even if an escaping gap were found, no script could load or execute. Authorization and tenant scoping close the IDOR.

**Best practice.** Prefer a template engine with contextual auto-escaping over string concatenation for HTML. Where concatenation is unavoidable, escape at every interpolation without exception — one miss is the whole vulnerability.

**Fully fixed after change:** ✅ Yes.

---

### 🟠 H-02 — `get_due_breakdown()` is `SECURITY DEFINER`, granted to all authenticated users, with no ownership check

| | |
|---|---|
| **File** | `supabase/fresh_supabase_schema.sql:~930–1030`, grant at `:919` / `:581` |
| **CWE** | CWE-639 · CWE-266 Incorrect Privilege Assignment | **OWASP** | A01:2021 |

```sql
CREATE OR REPLACE FUNCTION get_due_breakdown(p_customer_id UUID, p_selected_emi_no INT DEFAULT NULL)
...
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;      -- runs as the definer, RLS bypassed

GRANT EXECUTE ON FUNCTION get_due_breakdown(UUID, INT) TO authenticated;   -- every logged-in user
```

**Why it is vulnerable.** `SECURITY DEFINER` executes with the definer's privileges, so RLS on `emi_schedule` and `customers` does not constrain it. The function accepts an arbitrary `p_customer_id` and never verifies that the caller owns that customer. Because the grant is to `authenticated`, any retailer can invoke it directly from the browser via PostgREST (`POST /rest/v1/rpc/get_due_breakdown`) with any customer UUID.

**Attack scenario.** A retailer calls the RPC with a competitor's customer id (obtainable via C-04/C-05) and receives that customer's `next_emi_amount`, `next_emi_due_date`, `fine_due`, `first_emi_charge_due`, `total_payable` and `is_overdue` — a complete live financial position, straight from the database, without touching the API layer at all.

**Impact.** Cross-tenant financial disclosure that survives every fix made in the Next.js routes, because it bypasses them entirely.

**Secure fix.** Enforce the caller's scope inside the function:

```sql
CREATE OR REPLACE FUNCTION get_due_breakdown(p_customer_id UUID, p_selected_emi_no INT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp          -- see H-03
AS $$
DECLARE
  v_role        TEXT := get_my_role();
  v_retailer_id UUID := get_my_retailer_id();
  v_owner_id    UUID;
  ...
BEGIN
  SELECT retailer_id INTO v_owner_id FROM customers WHERE id = p_customer_id;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- The service role (server-side API) and super admins are unrestricted;
  -- a retailer may only ever query their own customers.
  IF current_user <> 'service_role' AND v_role IS DISTINCT FROM 'super_admin' THEN
    IF v_role IS DISTINCT FROM 'retailer' OR v_owner_id IS DISTINCT FROM v_retailer_id THEN
      RAISE EXCEPTION 'Not authorized for this customer';
    END IF;
  END IF;

  -- …existing body unchanged…
END;
$$;
```

**Why the new code is secure.** The ownership predicate runs inside the definer context before any data is read, so the privilege elevation that `SECURITY DEFINER` grants is now bounded by an explicit check. The `service_role` carve-out preserves the server-side API paths (`app/api/customer-login`, `app/api/customer-app-token`) that legitimately need unrestricted access.

**Best practice.** Every `SECURITY DEFINER` function granted to a broad role must re-implement the authorization that RLS would otherwise have provided — that is the price of the elevation. Prefer `SECURITY INVOKER` unless elevation is genuinely required.

**Fully fixed after change:** ✅ Yes.

---

### 🟠 H-03 — All `SECURITY DEFINER` functions lack `SET search_path`

| | |
|---|---|
| **Files** | `supabase/fresh_supabase_schema.sql` lines 265, 272, 331, 465, 542, 566, 762, 1030, 1104, 1261 — and the same functions across `migrations/*.sql` |
| **CWE** | CWE-426 Untrusted Search Path | **OWASP** | A01:2021 |

**Verified:** `grep -rn "search_path" supabase migrations` returns **zero** matches. Not one of the twelve `SECURITY DEFINER` functions pins its schema resolution.

```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER      -- ← no SET search_path
AS $$ SELECT role FROM profiles WHERE user_id = auth.uid(); $$;
```

**Why it is vulnerable.** With no pinned `search_path`, `profiles` is resolved against the *caller's* search path at execution time. A role able to create objects in a schema that precedes `public` can shadow `profiles` with its own table, and `get_my_role()` — running with definer privileges — will read the attacker's table instead. Since `get_my_role()` is the predicate behind nearly every RLS policy in the schema, subverting it subverts the entire access-control model.

Exploitation requires `CREATE` on some schema in the caller's path, which Supabase's default `authenticated` role does not hold — so this is a hardening gap rather than a directly reachable break today. It becomes directly exploitable the moment any role is granted schema-creation rights, or a future migration adds a schema to the default path. Supabase's own database linter flags this as `function_search_path_mutable`.

**Secure fix.** Pin the path on every `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp        -- ← resolve only against public
AS $$ SELECT role FROM profiles WHERE user_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION get_my_retailer_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT id FROM retailers WHERE auth_user_id = auth.uid(); $$;
```

Apply identically to `fn_generate_emi_schedule`, `get_due_breakdown`, `recalc_customer_fines`, `recalc_all_fines`, `approve_payment_request`, `calculate_and_apply_fines`, `apply_overdue_fines` and the remaining definer functions. Then verify none is missed:

```sql
-- Lists every SECURITY DEFINER function still lacking a pinned search_path.
SELECT n.nspname AS schema, p.proname AS function
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE p.prosecdef                                    -- SECURITY DEFINER
   AND n.nspname = 'public'
   AND NOT EXISTS (
     SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) AS c
      WHERE c LIKE 'search_path=%')
 ORDER BY 2;
-- Expected result after remediation: 0 rows.
```

**Why the new code is secure.** `SET search_path = public, pg_temp` fixes name resolution at definition time, so a shadowing table in another schema can never be reached. Including `pg_temp` last (rather than omitting it) follows PostgreSQL's documented guidance for definer functions.

**Best practice.** Make `SET search_path` mandatory in the definition template for every `SECURITY DEFINER` function, and run Supabase's database linter in CI.

**Fully fixed after change:** ✅ Yes.

---

### 🟠 H-04 — Privilege spoofing via client-supplied `collected_by_role` bypasses EMI sequence enforcement

| | |
|---|---|
| **File** | `app/api/payments/submit/route.ts` |
| **Function / lines** | `POST`, line 11 (destructured from body), line 54 (used as an authorization predicate), line 114 (persisted) |
| **CWE** | CWE-807 Reliance on Untrusted Inputs in a Security Decision · CWE-915 Mass Assignment |
| **OWASP** | A04:2021 Insecure Design |

**Vulnerable code**

```ts
const { customer_id, emi_ids, emi_nos, mode, utr, notes, retail_pin,
        ..., collected_by_role, collect_type } = body;     // ← from the REQUEST BODY
...
// ── SEQUENCE ENFORCEMENT: retailers must pay EMIs in order ────────────────
// Super admin (collected_by_role === 'admin') bypasses this check.
if (!noEmi && emi_nos?.length && collected_by_role !== 'admin') {
  //                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ attacker-controlled
  const { data: allUnpaid } = await svc.from('emi_schedule')...
  if (submittedMin > lowestUnpaidEmiNo) {
    return NextResponse.json({ error: `EMI sequence violation...` }, { status: 400 });
  }
}
...
collected_by_role:    collected_by_role || 'retailer',     // ← persisted as fact
collected_by_user_id: user.id,
```

**Why it is vulnerable.** `collected_by_role` arrives in the JSON body and is used verbatim as the condition that disables a business control. The route has already resolved the caller's true identity (`retailer` looked up by `auth_user_id` at lines 32–36) and could simply use it — the comment even asserts the value means "super admin", but nothing verifies that. The same unvalidated value is then written to `payment_requests.collected_by_role`, so it also corrupts the attribution record that reporting and audit rely on.

**Attack scenario.** A retailer submits a payment for EMI #9 while EMIs #3 through #8 are unpaid, adding `"collected_by_role": "admin"` to the request body. The sequence check is skipped. The payment is recorded as admin-collected. The borrower's earliest overdue instalments — the ones accruing fines — remain unpaid while a later one is marked settled, distorting the fine engine, the collection reports and the customer's completion status. Repeating this lets a retailer cherry-pick which instalments to record, and every such record falsely attributes the collection to an administrator.

**Impact.** Business-logic bypass with financial-integrity and non-repudiation consequences: the control that guarantees instalments are collected in order is disabled by the party it constrains, and the audit attribution is falsified.

**Secure fix.** Derive the role from the session; never accept it from the client:

```ts
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireRole(['retailer']);      // this route is the retailer path
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const body = await req.json().catch(() => ({}));
  const { customer_id, emi_ids, emi_nos, mode, utr, notes, retail_pin,
          total_emi_amount, scheduled_emi_amount, fine_amount, fine_breakdown,
          first_emi_charge_amount, total_amount, fine_for_emi_no, fine_due_date,
          collect_type } = body;
  // NOTE: collected_by_role is deliberately NOT read from the body.

  const svc = createServiceClient();
  const { data: retailer } = await svc.from('retailers')
    .select('id, retail_pin, is_active').eq('auth_user_id', actor.userId).single();
  if (!retailer?.is_active) {
    return NextResponse.json({ error: 'Retailer inactive' }, { status: 403 });
  }

  // Constant-time PIN comparison (see M-06).
  const { timingSafeEqual } = await import('node:crypto');
  const a = Buffer.from(String(retailer.retail_pin ?? ''));
  const b = Buffer.from(String(retail_pin ?? ''));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  // ── Ownership check (already present and correct — retained) ──────────────
  const { data: custOwner } = await svc.from('customers')
    .select('id, retailer_id').eq('id', customer_id).single();
  if (!custOwner || custOwner.retailer_id !== retailer.id) {
    return NextResponse.json({ error: 'Customer does not belong to your account' }, { status: 403 });
  }

  // ── SEQUENCE ENFORCEMENT — now unconditional for this route ───────────────
  // Admins collect through /api/payments/approve-direct, which is separately
  // gated on super_admin; this path is retailers only, so there is no bypass.
  if (!noEmi && emi_nos?.length) {
    const { data: allUnpaid } = await svc.from('emi_schedule')
      .select('emi_no').eq('customer_id', customer_id)
      .in('status', ['UNPAID', 'PARTIALLY_PAID'])
      .order('emi_no', { ascending: true }).limit(1);

    const lowestUnpaidEmiNo: number | undefined = allUnpaid?.[0]?.emi_no;
    if (lowestUnpaidEmiNo !== undefined) {
      const submittedMin = Math.min(...(emi_nos as number[]));
      if (submittedMin > lowestUnpaidEmiNo) {
        return NextResponse.json(
          { error: `EMI sequence violation. EMI #${lowestUnpaidEmiNo} must be paid first.` },
          { status: 400 },
        );
      }
    }
  }
  ...
  const { data: request, error: re } = await svc.from('payment_requests').insert({
    ...,
    collected_by_role:    actor.role,          // ← always 'retailer' here, from the session
    collected_by_user_id: actor.userId,
  }).select().single();
```

**Why the new code is secure.** `collected_by_role` no longer exists as an input — the value written to the database is `actor.role`, resolved from the session cookie via `profiles`, which the caller cannot influence. The admin bypass is not lost; it lives in `/api/payments/approve-direct`, a separate route already gated on `super_admin` at line 11. Attribution in `payment_requests` is now trustworthy.

**Best practice.** Any field that participates in an authorization or business-rule decision must be server-derived. Explicitly allow-list request-body fields rather than destructuring whatever arrives (this route currently accepts 17 body fields, several of which — `total_amount`, `fine_amount` — are financial values taken on trust; see M-04).

**Fully fixed after change:** ✅ Yes for the role spoofing.

---

### 🟠 H-05 — No security headers: no CSP, HSTS, X-Frame-Options or Referrer-Policy

| | |
|---|---|
| **File** | `next.config.js` (no `headers()` function) · `middleware.ts` (no header injection) |
| **CWE** | CWE-1021 Improper Restriction of Rendered UI Layers · CWE-693 Protection Mechanism Failure |
| **OWASP** | A05:2021 Security Misconfiguration |

**Verified:** `grep -rn "headers|X-Frame|Content-Security" next.config.js middleware.ts` returns nothing. The application ships **zero** security headers.

**Why it is vulnerable.** With no `Content-Security-Policy`, the stored XSS in H-01 executes without obstruction and can exfiltrate to any origin. With no `X-Frame-Options`/`frame-ancestors`, the admin and retailer dashboards can be framed by a hostile page and clickjacked — an attacker can overlay a transparent frame over the "Approve payment" or "Settle account" controls. With no `Strict-Transport-Security`, a first visit over HTTP is downgradeable. With no `Referrer-Policy`, the default leaks full URLs — which matters directly here because `/api/customer-app-token?token=…` and `/api/backup?token=…` carry secrets in the query string (H-06, H-08).

**Attack scenario.** An attacker hosts a page that frames `/admin`, positions an invisible iframe under an enticing button, and induces an authenticated admin to click — approving a fraudulent payment request without the admin ever seeing the portal. Independently, an admin who clicks an external link from a page whose URL contains a customer token leaks that token in the `Referer` header to the third-party site.

**Secure fix.** Add a headers block to `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for its bootstrap; the theme script in
      // app/layout.tsx should be moved to a nonce or an external file to allow
      // dropping 'unsafe-inline' entirely.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co https://i.ibb.co",
      "connect-src 'self' https://*.supabase.co",
      "font-src 'self' data:",
      "frame-ancestors 'none'",          // clickjacking
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'X-Frame-Options',        value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(isProd ? [{
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  }] : []),
];

const nextConfig = {
  // eslint / typescript ignore flags removed — see M-03
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ibb.co' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
module.exports = nextConfig;
```

**Why the new code is secure.** `frame-ancestors 'none'` plus `X-Frame-Options: DENY` makes the dashboards unframeable, eliminating clickjacking. The CSP constrains script and connection origins, so an injected script (H-01) cannot load remote code or exfiltrate to an attacker host. HSTS with a two-year max-age forces HTTPS on every subsequent visit. `strict-origin-when-cross-origin` stops query-string tokens leaking through `Referer`.

**Best practice.** Ship headers from day one and verify them in CI (e.g. an integration test asserting each header is present). Work toward removing `'unsafe-inline'` by moving the inline theme script in `app/layout.tsx:37` to a nonce-based or external script.

**Fully fixed after change:** ✅ Yes.

---

### 🟠 H-06 — No rate limiting anywhere: brute force, enumeration and resource exhaustion

| | |
|---|---|
| **Files** | Entire API surface — verified: `grep -rn "rate.?limit|throttle"` over `app/`, `lib/`, `components/` returns **zero** matches |
| **CWE** | CWE-307 Improper Restriction of Excessive Authentication Attempts · CWE-770 Allocation Without Limits |
| **OWASP** | A07:2021 Identification and Authentication Failures |

**Why it is vulnerable.** No endpoint applies any request throttle. The exposed surfaces are:

- **`/api/payments/submit`** — the `retail_pin` check at line 40 compares a 4–6 digit PIN with plain `!==`. A 4-digit PIN is 10,000 candidates; unthrottled, that is minutes of work.
- **`/api/customer-app-token?token=…`** — token validation with no attempt limit.
- **Supabase `signInWithPassword`** from `app/login/page.tsx:52` — Supabase applies its own limits, but the app adds none and does no lockout or alerting.
- **`/api/report/profit`** — issues an N+1 query per customer per retailer (lines 28–39: one `payment_requests` query for *every* customer). A handful of concurrent requests can saturate the database.

**Attack scenario.** An attacker with a valid retailer session enumerates `retail_pin` values against `/api/payments/submit` until one succeeds, then submits payments as that retailer. In parallel, repeated calls to `/api/report/profit` — which under C-06 any retailer may call — each fan out to thousands of sequential queries, exhausting the Supabase connection pool and taking the portal offline for everyone.

**Impact.** Credential and PIN compromise via brute force; application-level denial of service from a single authenticated client; no detection because failed attempts are not logged (M-09).

**Secure fix.** Add a shared limiter and apply it to authentication and expensive endpoints:

```ts
// lib/rateLimit.ts — in-memory limiter. For multi-instance deployments,
// back this with Upstash Redis or Vercel KV so counters are shared.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number):
  { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

/** Best-effort client identity: prefer the authenticated user, fall back to IP. */
export function clientKey(req: Request, userId?: string): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  return `ip:${fwd.split(',')[0].trim() || 'unknown'}`;
}
```

Applied to the PIN check in `app/api/payments/submit/route.ts`:

```ts
import { rateLimit, clientKey } from '@/lib/rateLimit';

// 5 PIN attempts per user per 15 minutes.
const limited = rateLimit(`pin:${clientKey(req, actor.userId)}`, 5, 15 * 60_000);
if (!limited.ok) {
  return NextResponse.json(
    { error: 'Too many attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
  );
}

const { timingSafeEqual } = await import('node:crypto');
const a = Buffer.from(String(retailer.retail_pin ?? ''));
const b = Buffer.from(String(retail_pin ?? ''));
if (a.length !== b.length || !timingSafeEqual(a, b)) {
  // Failed PIN attempts are security events — record them (see M-09).
  await svc.from('audit_log').insert({
    actor_user_id: actor.userId, actor_role: 'retailer',
    action: 'PIN_FAILED', table_name: 'retailers', record_id: retailer.id,
  });
  return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
}
```

**Why the new code is secure.** Five attempts per fifteen minutes reduces a 4-digit PIN search from minutes to roughly two months of sustained attempts, well inside detection range — and the `PIN_FAILED` audit rows make that attempt visible. `timingSafeEqual` removes the timing side channel that a naïve `!==` on a secret leaks. `Retry-After` keeps legitimate clients well-behaved.

**Best practice.** Rate-limit every unauthenticated endpoint and every endpoint that validates a secret. For multi-instance deployments use a shared store — an in-memory map resets on each cold start and is per-instance. Also raise the `retail_pin` minimum to 6 digits and store it hashed (M-06).

**Fully fixed after change:** ✅ Yes, with the shared-store caveat for horizontally scaled deployments.

---

### 🟠 H-07 — Audit log is forgeable by any authenticated user

| | |
|---|---|
| **File** | `supabase/fresh_supabase_schema.sql:868` (and `existing_supabase_upgrade.sql:552`) |
| **CWE** | CWE-117 Improper Output Neutralization for Logs · CWE-778 Insufficient Logging |
| **OWASP** | A09:2021 Security Logging and Monitoring Failures |

```sql
CREATE POLICY "audit_admin_read" ON audit_log FOR SELECT USING (get_my_role() = 'super_admin');
CREATE POLICY "audit_service_ins" ON audit_log FOR INSERT WITH CHECK (TRUE);
--                                                        ^^^^^^^^^^^^ anyone may insert anything
```

**Why it is vulnerable.** The `INSERT` policy admits every authenticated principal with no constraint on the row's contents. A retailer can therefore write `audit_log` entries claiming any `actor_user_id`, any `actor_role` (including `super_admin`), and any `action`. The intent was clearly to let the service-role client write audit rows, but the service role bypasses RLS anyway and never needed this policy.

**Attack scenario.** After abusing C-01 to reset a competitor's password, the attacker inserts a plausible run of `audit_log` rows attributing the change to the real administrator, and floods the table with noise entries to bury the genuine record. When the incident is investigated, the audit trail — the only forensic artefact in the system — implicates the wrong person.

**Impact.** Destroys non-repudiation and forensic integrity. Any incident response based on this table is unreliable.

**Secure fix.** Restrict inserts to the service role, which is the only legitimate writer:

```sql
DROP POLICY IF EXISTS "audit_service_ins" ON audit_log;

-- No INSERT policy for `authenticated` at all: the service-role client bypasses
-- RLS, so server-side audit writes continue to work, while browser clients
-- (anon / authenticated) can no longer insert anything.

-- Belt and braces: revoke the table privilege as well.
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM authenticated, anon;
GRANT  INSERT                 ON audit_log TO service_role;

-- Make entries immutable once written — no UPDATE or DELETE policy exists,
-- and the grants above ensure even a policy change cannot silently enable them.
```

**Why the new code is secure.** With no `INSERT` policy and no table grant, an authenticated browser client cannot write to `audit_log` under any circumstances. Server-side writes (`app/api/settlement/route.ts:62`, `app/api/admin/payments/[id]/route.ts:82`) continue unaffected because they use `createServiceClient()`, which is exempt from RLS. Absent `UPDATE`/`DELETE` policies and grants, existing entries are append-only.

**Best practice.** Audit logs must be append-only and writable only by a trusted server identity. Coverage is currently inconsistent too — `/api/retailers` (all three verbs), `/api/payments/approve` and `/api/broadcast` write nothing; every security-relevant mutation should emit an entry (see M-09).

**Fully fixed after change:** ✅ Yes for forgery. Coverage gaps are tracked separately as M-09.

---

### 🟠 H-08 — Backup secret accepted in the URL query string

| | |
|---|---|
| **File** | `app/api/backup/route.ts:40–51` |
| **CWE** | CWE-598 Use of GET Request Method With Sensitive Query Strings · CWE-208 Observable Timing Discrepancy |
| **OWASP** | A02:2021 Cryptographic Failures |

```ts
function authorize(req: NextRequest): boolean {
  const expected = process.env.BACKUP_TOKEN;
  if (!expected) return false;                    // ✅ fail-closed — good
  const header = req.headers.get('authorization') || '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const queryToken = req.nextUrl.searchParams.get('token') || '';   // ← secret in the URL
  const provided = bearer || queryToken;
  // "Constant-ish comparison (length check first); tokens are high-entropy."
  return provided.length > 0 && provided === expected;              // ← not constant-time
}
```

**Why it is vulnerable.** This token authorizes a **complete dump of every table** — `customers` (with Aadhaar), `profiles`, `customer_app_tokens`, `audit_log`. Accepting it as `?token=` places that secret into server access logs, CDN and proxy logs, browser history, and the `Referer` header of any outbound link (there is no `Referrer-Policy` — H-05). The code comment acknowledges the comparison is only "constant-ish"; `===` on strings short-circuits at the first differing byte, which is a genuine (if hard to exploit remotely) side channel.

The fail-closed behaviour when `BACKUP_TOKEN` is unset is correct and worth preserving.

**Attack scenario.** An operator triggers a backup from a browser or copies a URL containing the token into a ticket or chat. The token is now in logs and history. Anyone who recovers it gets `GET /api/backup?table=customers` — the entire customer database, including Aadhaar numbers — from the open internet, since `middleware.ts:20` explicitly exempts `/api/backup` from the session check.

**Secure fix.**

```ts
import { timingSafeEqual } from 'node:crypto';

function authorize(req: NextRequest): boolean {
  const expected = process.env.BACKUP_TOKEN;
  if (!expected) return false;                    // fail-closed — retained

  // Header only. A secret must never travel in a URL.
  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return false;
  const provided = header.slice(7).trim();

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;        // length check first, then constant-time
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Reject the legacy query parameter loudly so callers are forced to migrate.
  if (req.nextUrl.searchParams.has('token')) {
    return NextResponse.json(
      { error: 'Pass the token in the Authorization header, not the query string.' },
      { status: 400 },
    );
  }
  ...
}
```

The existing caller already uses the header (`backup/README.md:74` documents `curl -H "Authorization: Bearer …"`), so removing query support is not a breaking change. Update `backup/github-backup.mjs` if it uses the parameter, and rotate `BACKUP_TOKEN` after deploying, since any previously used value may already be in logs.

**Why the new code is secure.** The secret now travels only in a header, which is not logged by default, not stored in history, and not sent in `Referer`. `timingSafeEqual` removes the comparison side channel. Explicitly rejecting `?token=` prevents silent fallback to the insecure path.

**Best practice.** Secrets belong in headers or request bodies, never URLs. Always compare secrets with a constant-time primitive. Rotate any secret that has ever appeared in a URL.

**Fully fixed after change:** ✅ Yes. Note this endpoint remains a full-database egress point — consider IP-allowlisting it or moving it behind a private network path.

---

### 🟠 H-09 — Deactivated retailers keep working sessions

| | |
|---|---|
| **File** | `middleware.ts:50–68` · `app/api/retailers/route.ts:92` (`is_active` toggle) |
| **CWE** | CWE-613 Insufficient Session Expiration | **OWASP** | A07:2021 |

**Why it is vulnerable.** Setting `is_active = false` updates a database column but does nothing to the retailer's Supabase session — the refresh token remains valid and `middleware.ts` checks only `profiles.role`, never `retailers.is_active`. Of all the routes a retailer can reach, only `/api/payments/submit:38` consults the flag. Every read endpoint — `/api/retailer/dashboard`, `/api/retailer/emi-lists`, `/api/metrics`, `/api/export` — continues to serve a deactivated retailer their full customer book.

**Attack scenario.** A retailer is terminated for fraud and deactivated in the admin UI. Their browser session persists. They continue reading and exporting their entire customer list, contact details and payment history for as long as the refresh token lives — and can still use `/api/broadcast` to message their former customers, since that route checks role but not `is_active`.

**Impact.** Revocation is not revocation. Offboarding a compromised or dismissed retailer does not actually cut off access.

**Secure fix.** Check the flag centrally — `requireRole` in C-01 already does this (`if (!r?.is_active) return 403`). Add the same check to middleware so page routes are covered:

```ts
// middleware.ts — after the role lookup
const { data: profile } = await supabase
  .from('profiles').select('role').eq('user_id', user.id).single();
const role = profile?.role;

if (role === 'retailer') {
  const { data: retailer } = await supabase
    .from('retailers').select('is_active').eq('auth_user_id', user.id).single();
  if (!retailer?.is_active) {
    // Terminate the session outright rather than merely redirecting.
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'inactive');
    return NextResponse.redirect(url);
  }
}
```

And revoke server-side at the moment of deactivation, in `app/api/retailers/route.ts` `PATCH`:

```ts
if (is_active === false && retailer.auth_user_id) {
  // Invalidate every existing refresh token for this user immediately.
  await serviceClient.auth.admin.signOut(retailer.auth_user_id, 'global');
}
```

**Why the new code is secure.** `auth.admin.signOut(..., 'global')` invalidates the refresh tokens server-side, so the session cannot be renewed regardless of what the browser holds. The middleware and `requireRole` checks close the window until the current access token expires.

**Best practice.** Deactivation must revoke credentials, not just set a flag. Keep access-token lifetimes short (Supabase default is one hour) so any residual window is bounded.

**Fully fixed after change:** ✅ Yes.

---

## 4. Medium Vulnerabilities

### 🟡 M-01 — CSV formula injection in every export

**Files:** `lib/csv.ts:10–20` (`csvCell`) — affecting `/api/export`, `/api/export/collection`, and all `/api/report/*` routes.
**CWE-1236 · OWASP A03:2021**

`csvCell` implements RFC-4180 quoting correctly but does not neutralise leading `=`, `+`, `-`, `@`, tab or CR, which Excel and Google Sheets interpret as formulas. A retailer who sets a customer's name to a formula-prefixed string has it executed when an administrator opens the exported CSV — a path to local command execution via `=cmd|…` style payloads in older Excel, or data exfiltration via `=HYPERLINK`/`WEBSERVICE`.

**Fix** — neutralise in the one shared helper, so every export inherits it:

```ts
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (s === '') return '';

  // Neutralise spreadsheet formula injection: prefix with a single quote so
  // Excel/Sheets treat the value as literal text.
  if (FORMULA_TRIGGER.test(s)) s = `'${s}`;

  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
```

**Fully fixed:** ✅ Yes — one change covers every export that routes through `buildCsv` (which, after M-02, is all of them).

---

### 🟡 M-02 — Three report routes hand-roll CSV and bypass the safe builder

**Files:** `app/api/report/profit/route.ts:45` · `app/api/report/customer-profit/route.ts:23` · `app/api/report/fine-due/route.ts:23`
**CWE-1236 · CWE-93 CRLF Injection**

```ts
const csv = rows.map(r => r.join(',')).join('\r\n');   // no quoting, no escaping
```

A customer name containing a comma shifts every subsequent column; one containing `\r\n` forges an entire additional row. The repository already exports a correct builder in `lib/csv.ts` — these three routes simply do not use it. (The `"'" + c.imei` prefix scattered through them is an ad-hoc attempt at the same protection, applied to one field only.)

**Fix:** replace each with `buildCsv({ header, rows })` and `csvHeaders(filename)`, as shown in the C-04 and C-05 remediation code.

**Fully fixed:** ✅ Yes.

---

### 🟡 M-03 — Build-time type and lint errors suppressed

**File:** `next.config.js:3–4` · **CWE-1127 · OWASP A05:2021**

```js
eslint:     { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

Production builds succeed with type errors and lint failures unaddressed. Given how much of this codebase's authorization depends on correctly narrowing `profile?.role` and on non-null `retailerId` values, a suppressed type error is a plausible route to a real authorization bug. It also disables `eslint-plugin-security` and `@next/eslint-plugin-next` checks entirely.

**Fix:** remove both flags, fix the resulting errors, and gate CI on `tsc --noEmit && next lint`. If the backlog is large, remove `typescript.ignoreBuildErrors` first — it is the higher-value half.

**Fully fixed:** ✅ Yes, once the surfaced errors are resolved.

---

### 🟡 M-04 — Financial amounts accepted from the client without server-side recomputation

**File:** `app/api/payments/submit/route.ts:6–12,104–108` · `app/api/payments/approve-direct/route.ts:14,26–27`
**CWE-915 Mass Assignment · CWE-602 Client-Side Enforcement of Server-Side Security · OWASP A04:2021**

`total_emi_amount`, `scheduled_emi_amount`, `fine_amount`, `first_emi_charge_amount` and `total_amount` are taken from the request body and written to `payment_requests` verbatim. The server has everything it needs to compute them — `get_due_breakdown()` returns exactly these figures — but does not verify the client's numbers against them.

A retailer can therefore submit a payment recording `fine_amount: 0` on an EMI that has accrued a fine, or a `total_amount` that does not match the sum of its parts, distorting collection and profit reporting. The eventual approval path (`approve_payment_request`) applies the submitted figures.

**Fix:** recompute server-side and reject mismatches beyond a rounding tolerance:

```ts
const { data: breakdown } = await svc.rpc('get_due_breakdown', {
  p_customer_id: customer_id,
  p_selected_emi_no: emi_nos?.[0] ?? null,
});

const expectedFine   = Number(breakdown?.fine_due ?? 0);
const expectedCharge = Number(breakdown?.first_emi_charge_due ?? 0);

// Allow a 1-rupee tolerance for client-side rounding, no more.
if (Math.abs(Number(fine_amount || 0) - expectedFine) > 1 ||
    Math.abs(Number(first_emi_charge_amount || 0) - expectedCharge) > 1) {
  return NextResponse.json(
    { error: 'Payment breakdown does not match the amount due. Please refresh and retry.' },
    { status: 409 },
  );
}

const serverTotal = Number(total_emi_amount || 0) + expectedFine + expectedCharge;
if (Math.abs(Number(total_amount || 0) - serverTotal) > 1) {
  return NextResponse.json({ error: 'Total does not match its components.' }, { status: 409 });
}
```

**Fully fixed:** ✅ Yes for tampering with fine and charge components. `total_emi_amount` should additionally be validated against the sum of the selected `emi_schedule.amount` rows.

---

### 🟡 M-05 — Raw database errors returned to clients

**Files:** `app/api/payments/approve/route.ts:24,32` · `app/api/payments/reject/route.ts:54,59` · `app/api/retailers/route.ts:33,51,86,96` · `app/api/broadcast/route.ts:46,59` · and others
**CWE-209 Information Exposure Through an Error Message · OWASP A05:2021**

```ts
if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });
...
return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error' }, { status: 500 });
```

PostgREST and Postgres error messages disclose table names, column names, constraint names and occasionally row values — a free schema map for an attacker probing the API.

**Fix:** log the detail server-side, return an opaque message with a correlation id:

```ts
function serverError(err: unknown, context: string) {
  const ref = crypto.randomUUID().slice(0, 8);
  console.error(`[${ref}] ${context}`, err);      // full detail stays on the server
  return NextResponse.json(
    { error: 'An unexpected error occurred.', ref },   // ref lets support correlate
    { status: 500 },
  );
}
```

Validation errors (400-class) may stay specific; 500-class errors must not.

**Fully fixed:** ✅ Yes.

---

### 🟡 M-06 — `retail_pin` stored in plaintext and compared non-constant-time

**File:** `app/api/payments/submit/route.ts:32–41` · `supabase/fresh_supabase_schema.sql` (`retailers.retail_pin`)
**CWE-256 Plaintext Storage of a Password · CWE-208 · OWASP A02:2021**

```ts
const { data: retailer } = await svc.from('retailers')
  .select('id, retail_pin, is_active').eq('auth_user_id', user.id).single();
if (retailer.retail_pin !== retail_pin) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
```

The payment-confirmation PIN is stored as cleartext and returned into application memory on every submission. It appears in plaintext in `/api/backup` and `/api/admin/full-backup` dumps — and therefore in the public-repository backup of C-10. The UI restricts it to 6 digits (`app/admin/page.tsx:1113`), and combined with H-06 (no rate limiting) it is brute-forceable.

**Fix:** hash it, compare in constant time, and exclude it from backups:

```sql
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS retail_pin_hash TEXT;
-- Backfill via a one-off admin script, then:
ALTER TABLE retailers DROP COLUMN retail_pin;
```

```ts
import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync = promisify(scrypt) as (p: string, s: string, k: number) => Promise<Buffer>;

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key  = await scryptAsync(pin, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const key = await scryptAsync(pin, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
```

Also raise the minimum to 6 digits and add the rate limit from H-06 — hashing alone does not stop online guessing.

**Fully fixed:** ✅ Yes, combined with H-06.

---

### 🟡 M-07 — Unvalidated numeric parameters and unbounded queries

**Files:** `app/api/report/profit/route.ts:8–11` · `app/api/report/collection/route.ts:44–45` · `app/api/report/monthly/route.ts`
**CWE-20 Improper Input Validation · CWE-770 · OWASP A03:2021**

```ts
const m = parseInt(req.nextUrl.searchParams.get('month') || String(new Date().getMonth()+1));
const y = parseInt(req.nextUrl.searchParams.get('year')  || String(new Date().getFullYear()));
const ms = new Date(y, m-1, 1).toISOString();   // throws RangeError on NaN
```

`parseInt('abc')` yields `NaN`; `new Date(NaN, …).toISOString()` throws an unhandled `RangeError`, returning a 500 with a stack-trace-derived message (M-05). A large `year` produces an enormous scan range. `/api/export/collection:174–178` validates its month and year properly — that check simply was not applied consistently.

**Fix:** validate explicitly, as shown in the C-06 remediation, and add `.limit()` to every unbounded query.

**Fully fixed:** ✅ Yes.

---

### 🟡 M-08 — Service-role client silently falls back to a placeholder key

**File:** `lib/supabase/server.ts:5–7` · **CWE-1188 Insecure Default · OWASP A05:2021**

```ts
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://placeholder.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY  || 'placeholder-service-key';
```

The comment says these guard Next.js static analysis during build, which is a real problem — but the fallback applies at runtime too. A production deployment with a missing or misspelled `SUPABASE_SERVICE_ROLE_KEY` starts successfully and fails opaquely on every request, and `https://placeholder.supabase.co` is an outbound request to a domain the operator does not control.

**Fix:** allow placeholders only during build, and fail fast at runtime:

```ts
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

function required(name: string): string {
  const v = process.env[name];
  if (v) return v;
  if (isBuild) return `placeholder-${name}`;     // build-time analysis only
  throw new Error(`Missing required environment variable: ${name}`);
}

const SUPABASE_URL  = required('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON = required('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE  = required('SUPABASE_SERVICE_ROLE_KEY');
```

**Fully fixed:** ✅ Yes.

---

### 🟡 M-09 — Incomplete audit coverage; no failed-authentication logging

**Files:** `app/api/retailers/route.ts` (no audit on any verb) · `app/api/payments/approve/route.ts` · `app/api/broadcast/route.ts` · `app/login/page.tsx`
**CWE-778 Insufficient Logging · OWASP A09:2021**

An `audit_log` table exists and is used well in `app/api/settlement/route.ts:62` and `app/api/admin/payments/[id]/route.ts:82`, but the highest-risk operations write nothing: retailer creation, password reset, and deletion (C-01/C-02/C-03) leave no trace at all. Failed logins and failed PIN attempts are never recorded, so brute-force activity (H-06) is invisible.

**Fix:** emit an `audit_log` row from every state-changing route (examples in C-01, C-02, C-07, H-06) and record authentication failures. Because `app/login/page.tsx:52` calls Supabase directly from the browser, add a small server route to record failures, or enable Supabase's auth audit log and alert on it.

**Fully fixed:** ✅ Yes, once applied across all mutating routes.

---

### 🟡 M-10 — Aadhaar numbers stored and returned unmasked

**Files:** `app/api/customer-login/route.ts:8` · `app/api/customer-app-token/route.ts:55` · `app/api/backup/route.ts` · `app/api/admin/full-backup/route.ts`
**CWE-359 Exposure of Private Personal Information · OWASP A02:2021**

`aadhaar` is stored in plaintext, selected into API responses in full, and included verbatim in both backup dumps. Aadhaar is India's national identity number with specific statutory handling requirements under the Aadhaar Act and the DPDP Act 2023; it is the highest-value field in this database and the primary payload of C-07 and C-10.

**Fix:**
1. Mask on read wherever the full value is not strictly required — return `XXXXXXXX1234` from the customer portal and the customer-app token endpoint.
2. Store a salted hash for lookup, keeping the plaintext only if a legal obligation requires it — and if so, encrypt it at rest with `pgcrypto` under a key held outside the database.
3. Exclude the column from `/api/backup` and `/api/admin/full-backup` (see C-10).

```ts
export const maskAadhaar = (a?: string | null) =>
  a && a.length === 12 ? `XXXXXXXX${a.slice(-4)}` : null;
```

**Fully fixed:** ⚠️ Partially — masking closes the disclosure paths; full remediation requires encryption at rest and a data-retention decision.

---

## 5. Low Vulnerabilities

| ID | Finding | File | Fix |
|---|---|---|---|
| **L-01** | Full error objects logged, risking sensitive values in log aggregation | `app/api/payments/approve/route.ts:31`, `reject/route.ts:58`, `admin/payments/[id]/route.ts:95` | Log `err.message` and a correlation id; never the whole object or request body |
| **L-02** | Wildcard image host `*.ibb.co` (third-party image host) permitted | `next.config.js:8–9` | Drop the wildcard, keep only `i.ibb.co`; better, proxy images through Supabase Storage |
| **L-03** | `sessionStorage` response cache may retain customer data after logout | `lib/useCachedFetch.ts:36,50` | Clear all `tp-cache:*` keys on sign-out |
| **L-04** | Middleware public-route matching uses loose `startsWith` | `middleware.ts:7–9` | Anchor with exact match or a trailing-slash check, so `/customer-*` cannot accidentally become public |
| **L-05** | No MFA available for the super-admin account | `app/login/page.tsx` | Enable Supabase MFA (TOTP) and require it for `super_admin` |

---

## 6. OWASP Top 10 & CWE Mapping

| OWASP Top 10 (2021) | Findings | Count |
|---|---|---|
| **A01 Broken Access Control** | C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-09, C-10, H-01, H-02, H-03 | **12** |
| **A02 Cryptographic Failures** | H-08, M-06, M-10 | 3 |
| **A03 Injection** | H-01, M-01, M-02, M-07 | 4 |
| **A04 Insecure Design** | H-04, M-04 | 2 |
| **A05 Security Misconfiguration** | C-10, H-05, M-03, M-05, M-08, L-02 | 6 |
| **A06 Vulnerable Components** | C-08 | 1 |
| **A07 Auth Failures** | H-06, H-09, L-05 | 3 |
| **A09 Logging Failures** | H-07, M-09, L-01 | 3 |

| CWE | Description | Findings |
|---|---|---|
| CWE-862 | Missing Authorization | C-01, C-03 |
| CWE-306 | Missing Authentication for Critical Function | C-02 |
| CWE-639 | Authorization Bypass Through User-Controlled Key | C-04, C-05, C-06, C-07, C-09, H-01, H-02 |
| CWE-863 | Incorrect Authorization | C-08, C-09 |
| CWE-538 | Sensitive Information in Externally-Accessible File | C-10 |
| CWE-79 | Cross-site Scripting | H-01 |
| CWE-426 | Untrusted Search Path | H-03 |
| CWE-807 | Untrusted Input in a Security Decision | H-04 |
| CWE-1021 | Improper Restriction of Rendered UI Layers | H-05 |
| CWE-307 | Improper Restriction of Excessive Authentication Attempts | H-06 |
| CWE-117 / CWE-778 | Log Forgery / Insufficient Logging | H-07, M-09 |
| CWE-598 / CWE-208 | Sensitive Query String / Timing Discrepancy | H-08, M-06 |
| CWE-613 | Insufficient Session Expiration | H-09 |
| CWE-1236 | Formula Injection | M-01, M-02 |
| CWE-915 | Mass Assignment | H-04, M-04 |
| CWE-209 | Error Message Information Exposure | M-05 |
| CWE-256 | Plaintext Storage of a Password | M-06 |
| CWE-20 / CWE-770 | Improper Input Validation / Allocation Without Limits | M-07, H-06 |
| CWE-1188 | Insecure Default Initialization | M-08 |
| CWE-359 | Exposure of Private Personal Information | M-10 |

---

## 7. Customer Login — Descoped by Client (recorded, not counted)

You asked me to set this aside because customers only read their own data. These are recorded so the acceptance is informed, not implicit. **None is included in the score or the fix plan.**

| Ref | Observation | File | Note |
|---|---|---|---|
| CL-1 | Login requires only a 10-digit mobile **or** a 12-digit Aadhaar, with no OTP or second factor | `app/api/customer-login/route.ts:83–105` | Anyone knowing a borrower's phone number can read their full loan record. This is the client's accepted design. |
| CL-2 | `POST` with `customer_id` loads **any** customer by UUID with no authentication at all | `app/api/customer-login/route.ts:41–81` | ⚠️ **This one is not "read-only is fine."** A customer who knows another customer's UUID reads their full record — including `aadhaar` (line 8). That is one customer reading *another's* national identity number, not their own data. Worth a second look even under the current scope. |
| CL-3 | Full `aadhaar` returned in the login response payload | `app/api/customer-login/route.ts:8` | Mask to last-4 (M-10); the portal UI does not need the full value. |
| CL-4 | No rate limiting on the login endpoint | same file | Permits enumeration of valid mobile numbers. |
| CL-5 | Session and long-lived token held in `localStorage` | `app/customer/page.tsx:76,89–90` | Readable by any XSS on that origin; the token never expires (C-07). |
| CL-6 | Response distinguishes "no matching customer" from a successful lookup | `app/customer/page.tsx` / route line 120–125 | Account enumeration oracle. |

**Suggestion.** If nothing else here is actioned, consider **CL-2** — adding `.eq('mobile', verifiedMobile)` or requiring the id to come from the same request's verified lookup would close a cross-customer Aadhaar read for a few lines of code.

---

## 8. Prioritised Fix Plan

### Phase 1 — Before any production deployment (1–2 days)

| # | Action | Findings | Effort |
|---|---|---|---|
| 1 | `npm install next@^14.2.25` (latest 14.2.x), regenerate lockfile, verify `npm audit` clean | C-08 | 30 min |
| 2 | Create `lib/auth.ts` with `requireRole()` | enables 3–5 | 1 h |
| 3 | Gate `/api/retailers` POST + PATCH + DELETE on `super_admin` | C-01, C-02, C-03 | 1 h |
| 4 | Scope `/api/report/{customer-profit,fine-due,profit}` to the caller's retailer | C-04, C-05, C-06 | 3 h |
| 5 | Add the ownership check to `/api/customer-app-token` POST | C-07 | 1 h |
| 6 | Add `WITH CHECK` to `customers_retailer_upd` + the financial-columns trigger | C-09 | 2 h |
| 7 | Remove the `git add backups/` step; add `/backups/latest/` to `.gitignore`; make the repo private | C-10 | 1 h |

> **Verification gate for Phase 1:** with a *retailer* session, confirm every endpoint in rows 3–5 returns `403`, and that `/api/report/*` returns only that retailer's rows. With no session, confirm `DELETE /api/retailers` returns `401`.

### Phase 2 — Before onboarding real customer data (2–3 days)

| # | Action | Findings |
|---|---|---|
| 8 | Add `lib/html.ts` (`esc`/`safeUrl`); escape receipt + settlement-letter output; add authorization to both | H-01 |
| 9 | Add ownership check to `get_due_breakdown()`; add `SET search_path` to all 12 definer functions | H-02, H-03 |
| 10 | Derive `collected_by_role` from the session, not the body | H-04 |
| 11 | Add the security-headers block to `next.config.js` | H-05 |
| 12 | Add `lib/rateLimit.ts`; apply to PIN check, token validation and expensive reports | H-06 |
| 13 | Drop the `audit_service_ins` policy; revoke `INSERT` from `authenticated` | H-07 |
| 14 | Header-only `BACKUP_TOKEN` with `timingSafeEqual`; rotate the token | H-08 |
| 15 | Check `is_active` in middleware; `auth.admin.signOut` on deactivation | H-09 |

### Phase 3 — Hardening (3–5 days)

Items 16–25: formula-injection guard in `csvCell` (M-01); route the three legacy reports through `buildCsv` (M-02); remove the build-error suppressions and fix what surfaces (M-03); recompute payment amounts server-side (M-04); opaque 500s with correlation ids (M-05); hash `retail_pin` (M-06); validate all numeric params and bound every query (M-07); fail-fast env handling (M-08); complete audit coverage including failed authentications (M-09); mask Aadhaar on read (M-10); then the Low items L-01 – L-05, with MFA for `super_admin` as the highest-value of those.

---

## 9. Final Verification & Production Readiness

**Re-scan status.** This report reflects a full static re-review of the codebase at `da7fc01`. No fixes have been applied — the repository could not be modified from this session (see the note below), so every finding above is **open**. The "Fully fixed after change" line on each finding states what the supplied replacement code achieves once applied; it is not a claim that anything has been remediated yet.

**Production readiness: ❌ Not suitable for production deployment.**

Four blockers, in order of severity:

1. **C-10** — the backup workflow would publish every customer's Aadhaar number to a public repository. Currently unrealized (verified: nothing has ever been committed under `backups/latest/`), but it fires the moment backup secrets are configured. Fix before adding any secret.
2. **C-04, C-05, C-06** — any retailer can download every other retailer's complete customer list, contact details and financials with a single unauthenticated-by-role GET. This is a live, trivially reachable breach of tenant isolation.
3. **C-01, C-02, C-03** — retailer account takeover, unauthorized account creation, and an entirely unauthorized deletion endpoint.
4. **C-08** — the framework CVE that converts several of the above from "any logged-in user" into "anyone on the internet."

**What is genuinely good here,** and worth preserving through the remediation: the RLS policy set is thoughtfully designed and mostly correct; `approve_payment_request` is properly atomic and idempotent; `lib/csv.ts` and `lib/loanStatementHtml.ts` are correct implementations that only need to be used consistently; `lib/dbFetch.ts` solves a real pagination-correctness problem well; the backup endpoint fails closed when unconfigured; and — notably for a repository of this size — **not one secret is hardcoded**. The tenant-scoping pattern needed for C-04 through C-06 already exists and works correctly in `app/api/retailer/dashboard/route.ts`. The remediation is mostly a matter of applying existing, correct patterns uniformly.

**Recommended path:** complete Phase 1 (1–2 days), re-test the authorization matrix with both a retailer and an admin session, then complete Phase 2 before any real customer data is loaded. After Phases 1 and 2, the projected score is approximately **78/100** — acceptable for a controlled production launch, with Phase 3 to follow.

**Post-remediation verification checklist**

- [ ] With a retailer session: every `/api/report/*` response contains only that retailer's rows
- [ ] With a retailer session: `POST`, `PATCH`, `DELETE /api/retailers` all return `403`
- [ ] With no session: `DELETE /api/retailers` returns `401` (not `307` to `/login`)
- [ ] `POST /api/customer-app-token` with a foreign `customer_id` returns `404`
- [ ] Direct PostgREST `PATCH` on `customers` changing `retailer_id` is rejected by the database
- [ ] A customer name containing HTML renders as inert text in the receipt view
- [ ] The definer-function query in H-03 returns **0 rows**
- [ ] `curl -I https://<host>/` shows CSP, HSTS, X-Frame-Options and Referrer-Policy
- [ ] `npm audit --omit=dev` reports no high or critical advisories
- [ ] `git log --all -- 'backups/latest/*'` remains empty

---

## Appendix A — Endpoint Authorization Matrix

Status as audited. ✅ correct · ⚠️ partial · ❌ missing.

| Endpoint | Authn | Role check | Tenant scoping | Status |
|---|---|---|---|---|
| `POST /api/retailers` | ✅ | ❌ | n/a | 🔴 **C-03** |
| `PATCH /api/retailers` | ✅ | ❌ | ❌ | 🔴 **C-01** |
| `DELETE /api/retailers` | ❌ | ❌ | ❌ | 🔴 **C-02** |
| `GET /api/report/customer-profit` | ✅ | ❌ | ❌ | 🔴 **C-04** |
| `GET /api/report/fine-due` | ✅ | ❌ | ❌ | 🔴 **C-05** |
| `GET /api/report/profit` | ✅ | ❌ | ❌ | 🔴 **C-06** |
| `POST /api/customer-app-token` | ✅ | ✅ | ❌ | 🔴 **C-07** |
| `GET /api/customer-app-token` | token | n/a | ✅ | ⚠️ H-08 (token in URL) |
| `GET /api/settlement-letter/[id]` | ❌ | ❌ | ❌ | 🟠 **H-01** |
| `GET /api/receipt/[id]` | ❌ public | ❌ | ❌ | 🟠 **H-01** |
| `POST /api/payments/submit` | ✅ | ⚠️ | ✅ | 🟠 **H-04** (role from body) |
| `POST /api/payments/approve` | ✅ | ✅ | n/a admin | ✅ |
| `POST /api/payments/reject` | ✅ | ✅ | n/a admin | ✅ |
| `POST /api/payments/approve-direct` | ✅ | ✅ | n/a admin | ✅ |
| `POST /api/admin/approve-request` | ✅ | ✅ | n/a admin | ✅ |
| `PATCH,DELETE /api/admin/payments/[id]` | ✅ | ✅ | n/a admin | ✅ |
| `GET /api/admin/full-backup` | ✅ | ✅ | n/a admin | ✅ |
| `GET /api/admin/retailer-summary` | ✅ | ✅ | n/a admin | ✅ |
| `GET /api/admin/top-products` | ✅ | ✅ | n/a admin | ✅ |
| `GET /api/admin/expected-loss` | ✅ | ✅ | n/a admin | ✅ |
| `GET /api/retailer/dashboard` | ✅ | ✅ | ✅ | ✅ **reference pattern** |
| `GET /api/retailer/emi-lists` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/retailer/report` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/metrics` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/export` | ✅ | ⚠️ | ✅ | ✅ |
| `GET /api/export/collection` | ✅ | ✅ | n/a admin | ✅ |
| `GET /api/report/collection` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/report/monthly` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/report/payment-collection` | ✅ | ✅ | n/a admin | ✅ |
| `POST /api/settlement` | ✅ | ✅ | n/a admin | ✅ |
| `POST,DELETE /api/broadcast` | ✅ | ✅ | ✅ | ✅ |
| `POST,GET /api/fines/recalc` | ✅/secret | ✅ | n/a | ✅ |
| `GET /api/backup` | secret | n/a | n/a | ⚠️ H-08 |
| `POST /api/customer-login` | ❌ by design | n/a | ⚠️ | descoped (§7) |

**11 of 31 endpoints have an authorization defect.**

---

*Prepared as a defensive security assessment. No exploit code, payloads, or attack tooling are included — attack scenarios are described at the conceptual level required to convey impact and justify each fix.*
