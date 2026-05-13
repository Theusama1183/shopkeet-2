# ShopKeet — Full Code Audit Report

> Generated: 2026-05-13  
> Scope: All source files in app/, lib/, components/, db/, proxy.ts, next.config.ts, package.json  
> Severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Quality

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical (crash / data loss) | 7 |
| 🟠 High (security / data integrity) | 8 |
| 🟡 Medium (bugs / future crashes) | 16 |
| 🔵 Quality (dead code / maintainability) | 13 |
| **Total** | **44** |

---

## 🔴 CRITICAL

---

### BUG-01 · `proxy.ts` — Wrong filename, middleware never runs

**File:** `proxy.ts`

Next.js middleware MUST be in a file named `middleware.ts` at the project root.
The file is named `proxy.ts` so Next.js never loads it. This means:
- No subdomain routing (admin / auth / storefront routing is completely broken)
- No rate limiting runs on any request
- Every request hits the wrong route

**Fix:** Rename the file.

```
proxy.ts  →  middleware.ts
```

---

### BUG-02 · `app/api/stores/[id]/products/route.ts:145` — Cache invalidation silently does nothing

```ts
// WRONG — cacheDelete takes a single key, not a glob
await cacheDelete(`products:store:${storeId}:*`).catch(() => {});
```

`cacheDelete` deletes one exact key. Passing a glob pattern `*` just tries to delete a key
literally named `products:store:X:*`, which does not exist. The paginated product cache
is never invalidated after a product is created. Users see stale product lists.

**Fix:**
```ts
await cacheDeletePattern(`products:store:${storeId}:*`).catch(() => {});
```

---

### BUG-03 · `lib/supabase/database.ts:65` — Missing env guard in `getServiceRoleDatabase()`

```ts
export function getServiceRoleDatabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  // NEXT_PUBLIC_SUPABASE_URL is never checked here but used with !
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,  // ← crashes if missing
    ...
  );
}
```

`NEXT_PUBLIC_SUPABASE_URL` is checked in `getAnonDatabase()` but NOT in
`getServiceRoleDatabase()`. If the env var is missing, the `!` suppresses TypeScript
and the Supabase client is created with `undefined` as the URL — runtime crash on
every system operation (audit logs, store creation, product creation).

**Fix:** Add the same guard:
```ts
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
```

---

### BUG-04 · `app/admin/onboarding/page.tsx` — Step3 user is stuck on error, no recovery

```ts
const res = await createStore(null, form);
if (res?.error) {
    alert(res.error);
    // Handle error (maybe go back?)   ← never implemented
}
```

On any error during store creation, `alert()` fires and the user is permanently stuck
on the animated loading screen with no way to go back or retry. The page has no
error state, no back button, and no navigation.

Additionally `res.subdomain` is accessed without null-checking `res` — if `createStore`
throws an unhandled exception, `res` is `undefined` and `.subdomain` crashes the page.

**Fix:** Add error state and a "Try again" button. Guard `res` before accessing properties.

---

### BUG-05 · `app/admin/onboarding/page.tsx:193` — `useEffect` missing `formData` dependency

```ts
useEffect(() => {
  const sequence = async () => {
    ...
    form.append("name", formData.name);   // formData from props
    form.append("subdomain", formData.subdomain);
  };
  sequence();
}, []);  // ← empty deps, formData is stale if it changed
```

The effect captures `formData` from props at mount time. If React re-renders Step3
with updated `formData` before the effect fires, the store is created with stale data.
The dep array must include `formData`.

---

### BUG-06 · `app/admin/store/[id]/products/page.tsx` — Dead server fetch, data never used

```ts
async function getProducts(storeId: string) { ... }  // defined but never called

export default async function ProductsPage({ params }) {
  const { id: storeId } = await params;
  return <ProductsTable storeId={storeId} />;  // fetches its own data via React Query
}
```

`getProducts()` is defined and never called. `ProductsTable` fetches its own data
via `useProducts()` → `/api/stores/[id]/products`. The server-side fetch is dead code.
There is no SSR prefetch — the table always shows a loading skeleton on first render.

**Fix:** Either call `getProducts()` and pass data as `initialData` to React Query,
or delete the dead function.

---

### BUG-07 · `app/admin/store/[id]/products/products-client.tsx:~90` — Wrong navigation paths (404 on every link)

```tsx
<Link href={`/store/${storeId}/products/new`}>
<Link href={`/store/${storeId}/products/${p.id}/edit`}>
```

Admin routes are under `/admin/store/[id]/...` but all links use `/store/[id]/...`
(missing `/admin` prefix). Every "Add product", "Edit", and row-click link 404s.

The same bug exists in:
- `pages-client.tsx` — all page links
- `brands-client.tsx` — all brand links
- `categories-client.tsx` — all category links
- `collections-client.tsx` — all collection links

**Fix:** Prefix all hrefs with `/admin`:
```tsx
<Link href={`/admin/store/${storeId}/products/new`}>
```

---

## 🟠 HIGH

---

### BUG-08 · `lib/stores/user-store.ts` — Auth state persisted to localStorage, never synced with Supabase

```ts
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({ user: null, isAuthenticated: false }),
    { name: 'shopkeet-user' }
  )
);
```

The user object is persisted to `localStorage`. When a user logs out via Supabase Auth,
`isAuthenticated` in this store stays `true` until the page is refreshed. Any component
reading `useUserStore().isAuthenticated` instead of the Supabase session will show the
user as logged in after logout.

This store is never updated from `supabase.auth.onAuthStateChange`.

**Fix:** Subscribe to auth state changes and call `clearUser()` on `SIGNED_OUT`:
```ts
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') useUserStore.getState().clearUser();
});
```

---

### BUG-09 · `lib/cache-helpers.ts:14` — `revalidateTag` called with non-existent second argument

```ts
_revalidateTag(tag, "max");
```

`revalidateTag` in Next.js takes exactly ONE argument: `revalidateTag(tag: string)`.
The second argument `"max"` does not exist in the API. The comment says
"Next.js 16 requires second argument" — this is incorrect. This will cause a
TypeScript error and may silently fail at runtime.

**Fix:**
```ts
_revalidateTag(tag);
```

---

### BUG-10 · `lib/supabase/client.ts` + `lib/supabase/server.ts` — `sameSite: "strict"` breaks subdomain auth

```ts
cookieOptions: {
  sameSite: "strict",  // ← breaks cross-subdomain navigation
}
```

`sameSite: "strict"` means cookies are NOT sent on cross-site navigations. Since the
app uses subdomains (`admin.domain.com`, `auth.domain.com`, `store.domain.com`),
navigating between them is treated as cross-site. Auth cookies are dropped, causing
unexpected logouts when users navigate between subdomains.

**Fix:** Change to `"lax"` in both files:
```ts
sameSite: "lax",
```

---

### BUG-11 · `app/api/upload/route.ts` — R2 credentials used with `!` but never validated

```ts
const r2 = new S3Client({
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

All four R2 env vars are accessed with `!` but never validated. If any are missing,
the S3 client is created with `undefined` values and throws a cryptic error on the
first upload. The error message will not indicate which env var is missing.

**Fix:** Add validation at the top of the handler:
```ts
const required = ['R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','R2_PUBLIC_URL'];
for (const key of required) {
  if (!process.env[key]) return NextResponse.json({ error: `Missing env: ${key}` }, { status: 500 });
}
```

---

### BUG-12 · `app/admin/store/[id]/settings/settings-client.tsx` — Delete store is fake

```tsx
onClick={() => confirm("Are you absolutely sure?") && alert("Contact support to delete your store.")}
```

The delete button shows a confirm dialog then an alert saying to contact support.
This is a placeholder that was never implemented. Users who want to delete their
store have no actual path to do so. This is a broken feature shipped to production.

---

### BUG-13 · `lib/audit/logger.ts:~80` — `storeId` filter is in-memory after paginated DB query

```ts
// Fetch up to 200 rows from DB with pagination applied
const { data } = await query.range(offset, offset + safeLimit - 1);

// Then filter in memory
if (filters.storeId && data) {
  return data.filter((log) => log.metadata?.storeId === filters.storeId);
}
```

Pagination (`range`) is applied BEFORE the in-memory `storeId` filter. You can request
page 2 (offset 50) and get 0 results even when there are 200 matching rows on page 1.
The results are silently wrong.

The TODO comment acknowledges this: `// TODO: Add storeId column to audit_logs table`

**Fix:** Add `store_id` column to `audit_logs` and filter at the DB level.

---

### BUG-14 · `next.config.ts` — `reactStrictMode: false` hides real bugs

```ts
reactStrictMode: false,
// Disabled to prevent double-rendering in development
```

Strict mode double-renders expose side effects in `useEffect`. Disabling it hides
real bugs that will surface in production. The correct fix is to make effects
idempotent, not to disable strict mode.

---

### BUG-15 · `app/api/stores/[id]/route.ts:~100` — `logo` field not validated as URL

```ts
if (logo !== undefined) {
  updates.logo = logo;  // any string accepted, including javascript: URIs
}
```

The PATCH handler accepts any string as `logo` without URL validation. A malicious
user could store a `javascript:` or `data:` URI as their logo URL.

**Fix:**
```ts
if (logo !== undefined && logo !== null) {
  try { new URL(logo); } catch {
    return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
  }
  updates.logo = logo;
}
```

---

## 🟡 MEDIUM

---

### BUG-16 · `lib/queries/pages.server.ts:~30` — `createPage` manually sets `created_at` / `updated_at`

```ts
created_at: new Date().toISOString(),
updated_at: new Date().toISOString(),
```

These columns have `defaultNow()` in the Drizzle schema and should be set by the
database. Setting them from the application layer causes clock skew (server time vs
DB time). Remove these lines.

---

### BUG-17 · `lib/queries/pages.server.ts:~90` — `isSlugAvailable` uses `.single()` instead of `.maybeSingle()`

```ts
const { data, error } = await query.single();
```

`.single()` throws a different error if multiple rows are returned. Without a unique
constraint on `(store_id, slug)` in the DB, this can crash. Use `.maybeSingle()`.

---

### BUG-18 · `lib/queries/pages.server.ts:~200` — `getHomePage` fallback includes empty string slug

```ts
.in('slug', ['home', 'index', ''])
```

An empty string `''` is invalid per `slugSchema` (min length 1). This query will
never match a real page. Remove `''` from the array.

---

### BUG-19 · `app/admin/store/[id]/design/layout.tsx` — Duplicate auth + ownership check

The design layout re-checks authentication and store ownership even though the parent
`[id]/layout.tsx` already does both checks. This results in 2 extra DB queries on
every design page load. The design layout should trust the parent layout.

---

### BUG-20 · `app/admin/store/[id]/pages/pages-client.tsx:~130` — `window.location.href` causes full page reload

```tsx
onRowClick={(item) => {
  window.location.href = `/store/${store.id}/pages/${(item as Page).id}/edit`;
}}
```

This causes a full page reload instead of client-side navigation. Use `router.push()`.
The same issue exists in `products-client.tsx`.

---

### BUG-21 · `lib/queries/products.ts` — `Product` type has snake_case fields but components access camelCase

```ts
export interface Product {
  is_active: boolean;   // snake_case
  store_id: string;     // snake_case
  created_at: string;   // snake_case
}
```

`products-client.tsx` accesses `p.isActive`, `p.status`, `p.quantity` — camelCase
fields that don't exist on this interface. TypeScript should catch this but the
component casts to `Product`. Also `quantity` doesn't exist in the `products` table
at all (it lives in the `inventory` table).

---

### BUG-22 · `lib/auth/rate-limit.ts` — Login and signup share the same rate limit bucket

```ts
export async function checkAuthRateLimit(id: string) {
  return rateLimits.auth.limit(`auth:${id}`);    // same bucket
}
export async function checkSignupRateLimit(id: string) {
  return rateLimits.auth.limit(`signup:${id}`);  // same bucket
}
```

Both functions use `rateLimits.auth` (10 req/min). A user who signs up 5 times and
logs in 5 times hits the limit. They should use separate rate limit buckets.

---

### BUG-23 · `package.json` — `web-vitals` listed in both `dependencies` and `devDependencies` with different versions

```json
"dependencies":    { "web-vitals": "^4.2.4" },
"devDependencies": { "web-vitals": "^3.5.0" }
```

Two different versions. The `devDependencies` version (3.x) may shadow the
`dependencies` version (4.x) depending on the package manager. Remove the
`devDependencies` entry.

---

### BUG-24 · `package.json` — `react-hook-form` missing as direct dependency

`@hookform/resolvers` is listed but `react-hook-form` itself is not in `dependencies`.
It is installed as a transitive dependency, but a version bump of the resolver could
drop it. Add `react-hook-form` explicitly.

---

### BUG-25 · `lib/supabase/server.ts` — `createClient` wrapped in `cache()` but `setAll` silently swallows errors

```ts
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch (error) {
    // The `set` method was called from a Server Component.
    // This can be ignored if you have middleware refreshing user sessions.
  }
}
```

The comment says this is safe if middleware refreshes sessions. But middleware
(BUG-01) is never loaded because the file is named `proxy.ts`. So session refresh
never happens, and cookie write failures are silently ignored. Fix BUG-01 first.

---

### BUG-26 · `app/[domain]/page.tsx` — Placeholder product cards with hardcoded prices ship to production

```tsx
{[1, 2, 3].map((i) => (
  <div key={i}>
    <h3 className="font-bold">Product {i}</h3>
    <p className="text-gray-500">$19.99</p>
  </div>
))}
```

The fallback "no home page" view shows fake product cards with hardcoded `$19.99`.
This is placeholder UI that ships to production and will confuse real customers.

---

### BUG-27 · `lib/redis/cache.ts` — Circuit breaker is per-process, ineffective in serverless

```ts
let circuitOpen = false;   // module-level, lost on every cold start
let circuitOpenedAt = 0;
```

In a serverless environment (Vercel), each function invocation is a separate process.
The circuit breaker state is never shared between instances. If Redis goes down, each
new invocation tries Redis, fails, and opens its own circuit — but the next invocation
starts fresh. The circuit breaker provides no protection in serverless deployments.

---

### BUG-28 · `app/admin/store/[id]/page.tsx` — Dashboard stats are all hardcoded zeros with fake sparkline data

```ts
value: "$0.00",
data: [120, 180, 150, 220, 190, 280, 320],  // fake data
// TODO: Replace with real data from analytics
```

The dashboard shows fake sparkline data and hardcoded zeros. This TODO has been
shipped to production.

---

### BUG-29 · `proxy.ts:~55` — `hostname` replacement is fragile, breaks on `127.0.0.1`

```ts
const hostname = host.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
```

If someone accesses via `127.0.0.1:3000`, none of the hostname checks match and the
request falls through to the storefront rewrite with `hostname = "127.0.0.1:3000"`,
which will fail to find a store and show a 404.

---

### BUG-30 · `lib/validations/store.ts` — Transform silently truncates instead of showing max-length error

```ts
.max(63, "Subdomain must be under 63 characters")
.transform((val) => val.toLowerCase()...substring(0, 63));
```

The `.max(63)` check runs before the transform. But the transform also truncates to 63
chars. If a user types 70 chars, the max check fires and shows the error — correct.
But if the input passes max (e.g. 63 chars) and the transform produces fewer chars
(e.g. stripping hyphens), the user sees a different subdomain than they typed with
no warning.

---

### BUG-31 · `lib/supabase/database.ts` — `transaction()` is not a real transaction

```ts
export async function transaction<T>(
  operations: (db) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  return operations(db);  // no atomicity
}
```

This function runs operations sequentially with no atomicity. If the second operation
fails, the first is NOT rolled back. Naming it `transaction` is dangerously misleading.

**Fix:** Rename to `withDatabase()` or add a comment warning it is NOT atomic.

---

## 🔵 CODE QUALITY

---

### Q-01 · Zustand stores missing `"use client"` directive

`lib/stores/ui-store.ts`, `loading-store.ts`, `editor-store.ts`, `store-store.ts`,
`user-store.ts` — none have `"use client"` at the top. In Next.js App Router, any
file that uses browser APIs or React hooks must be marked as a client component.
Zustand's `create()` uses React context internally. Add `"use client"` to all store files.

---

### Q-02 · Pervasive `as any` casts on Supabase insert/update calls

Throughout the codebase:
```ts
.insert({ name, subdomain, user_id: user.id } as any)
.upsert({ id: user.id, email: user.email! } as any, ...)
```

`types/supabase.ts` (generated by Supabase) provides proper insert types.
Use `Database['public']['Tables']['stores']['Insert']` instead of `as any`.
The `as any` casts defeat TypeScript's type safety entirely.

---

### Q-03 · Repeated manual snake_case → camelCase conversion

The same `(data as any).field_name` → camelCase mapping is duplicated in:
- `getActiveTemplate()` in `templates.server.ts`
- `getLayoutTemplates()` in `templates.server.ts`
- `getPageBySlug()` in `pages.server.ts`
- `getHomePage()` in `pages.server.ts`

Extract shared `normalizePage()` and `normalizeTemplate()` helper functions.

---

### Q-04 · Dead code in `lib/supabase/database.ts`

`SupabaseQuery<T>`, `TableName`, `table()`, and `serviceTable()` are defined but
never imported anywhere in the codebase. Remove them.

---

### Q-05 · `lib/redis/rate-limit.ts` — `_fallbackKey` parameter is unused

```ts
export async function checkRateLimit(
  limiter: Ratelimit | null,
  _fallbackKey: string,   // never used inside the function
  identifier: string
)
```

Remove the parameter and update all call sites (5 locations).

---

### Q-06 · `lib/stores/editor-store.ts` — History stores `any` type

```ts
interface EditorHistory {
  past: any[];
  present: any;
  future: any[];
}
```

Define a proper `PuckData` type from `@puckeditor/core` and use it here.

---

### Q-07 · `lib/stores/store-store.ts` — Duplicates Supabase `Store` type

The `Store` interface in `store-store.ts` duplicates `lib/supabase/types-helper.ts`.
Import and use the canonical type.

---

### Q-08 · `lib/queries/stores.ts` — Local `Store` interface has wrong field types

```ts
interface Store {
  createdAt: Date;   // Date object
}
```

The Supabase type has `created_at: string`. These are inconsistent and will cause
runtime errors if code mixes them. Use the canonical Supabase type.

---

### Q-09 · `app/admin/store/[id]/products/products-client.tsx` — Raw `<img>` tags bypass Next.js optimization

```tsx
<img src={p.image} alt={p.name} className="w-full h-full object-cover" />
```

Use `<Image>` from `next/image`. Same issue in `brands-client.tsx` and
`settings-client.tsx` (logo preview).

---

### Q-10 · `app/admin/store/[id]/brands/brands-client.tsx` — `MoreHorizontal` button does nothing

```tsx
<button className="p-1.5 rounded-lg ...">
  <MoreHorizontal className="w-4 h-4" />
</button>
```

No `onClick` handler. Dead UI element. Same in `products-client.tsx`.

---

### Q-11 · `lib/errors/index.ts` — `substr` is deprecated  (fixed)

```ts
Math.random().toString(36).substr(2, 9)
```

`substr` is deprecated. Use `substring(2, 11)` instead.

---

### Q-12 · `app/admin/store/[id]/settings/settings-client.tsx` — Logo URL rendered without validation

```tsx
{form.logo && (
  <img src={form.logo} alt="logo" />
)}
```

Any URL entered in the logo field is immediately rendered as an `<img>` src.
Validate the URL format before rendering.

---

### Q-13 · Loading state `useEffect` pattern duplicated in every query hook

The same `useEffect` that calls `startLoading` / `stopLoading` is copy-pasted into
`useStores`, `useStore`, `useProducts`, `useProduct`, `usePages`, `usePage`,
`useBrands`, `useCollections`, `useCategories`, `useTags` — 10+ identical blocks.

Extract a shared `useQueryLoading(key, isLoading)` hook.

---

## Priority Fix Order

2. **BUG-07** — Fix all `/store/` links to `/admin/store/` (every nav link 404s)
3. **BUG-02** — Fix cache invalidation (`cacheDelete` → `cacheDeletePattern`)
4. **BUG-09** — Fix `revalidateTag` second argument
5. **BUG-10** — Fix `sameSite: "strict"` → `"lax"` (auth breaks across subdomains)
6. **BUG-03** — Add env guard to `getServiceRoleDatabase()`
7. **BUG-04/05** — Fix onboarding Step3 error handling
8. **BUG-08** — Sync user store with Supabase auth state
9. **Q-01** — Add `"use client"` to all Zustand store files
10. **BUG-15** — Validate logo URL in PATCH handler
