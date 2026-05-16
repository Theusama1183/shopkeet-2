Ab mere paas sab kuch hai. Teeno remaining issues ka poora picture clear hai. Ab precise fix prompt likhta hoon.

You are a Senior Software Engineer working on ShopKeet — a multi-tenant 
SaaS e-commerce platform built on Next.js 16 App Router, TypeScript strict 
mode, Supabase, and Puck Editor.

You have been given EXACTLY 4 issues to fix. Nothing more, nothing less.
Read every word carefully. Fix only what is described. Do not refactor 
anything that is not mentioned.

---

## CONTEXT: WHAT IS ALREADY WORKING — DO NOT TOUCH

The following are already correctly implemented. Leave them alone:

- API route: app/api/stores/[id]/pages/[pageId]/route.ts
  → Auth check ✅, ownership check ✅, Zod validation ✅, rate limiting ✅
  
- API route: app/api/stores/[id]/templates/[templateId]/route.ts  
  → Auth check ✅, soft delete ✅, mutex (deactivate others on activate) ✅
  
- API route: app/api/stores/[id]/popups/[popupId]/route.ts
  → Auth check ✅, soft delete ✅, Inngest events ✅

- components/puck/renderer.tsx → RSC, ErrorBoundary ✅
- components/puck/countdown-timer.tsx → Real useState/useEffect timer ✅
- app/admin/store/[id]/popups/page.tsx → ConfirmDialog, sequential delete ✅
- app/admin/store/[id]/templates/templates-client.tsx → ConfirmDialog ✅
- app/admin/store/[id]/design/[pageId]/page.tsx → isDirty, beforeunload ✅

---

## THE 4 ISSUES TO FIX

---

### ISSUE 1 — BROKEN JSX: TwoColumnSection Missing Closing Tags

File: lib/puck/config.tsx
Component: TwoColumnSection

The render function of TwoColumnSection has two missing closing `</div>` 
tags. The left column and right column each have an outer 
`<div className="space-y-6">` that is never closed. This causes a JSX 
parse error and the entire config.tsx file will fail to compile.

Current broken structure (simplified):
```tsx
<div className={`grid grid-cols-1 ...`}>
  {/* Left Column */}
  <div className="space-y-6">
    {leftImage && (...)}
    {leftContent && (
      <div
        className="prose prose-zinc max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(...) }}
      />
    )}
    {/* ← MISSING </div> to close left column's space-y-6 */}
  
  {/* Right Column */}
  <div className="space-y-6">
    {rightImage && (...)}
    {rightContent && (
      <div
        className="prose prose-zinc max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(...) }}
      />
    )}
    {/* ← MISSING </div> to close right column's space-y-6 */}
  </div>  {/* this closes the grid div, not the column */}
</div>
```

FIX REQUIRED:
Add the two missing `</div>` closing tags — one after each column's 
content block, before the next column starts or before the grid closes.

Correct structure after fix:
```tsx
<div className={`grid grid-cols-1 ${widthMap[leftWidth]} ${gapMap[gap]} ${alignMap[verticalAlign]} ...`}>
  
  {/* Left Column */}
  <div className="space-y-6">
    {leftImage && (
      <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden">
        <img src={leftImage} alt="Left column" className="w-full h-full object-cover" />
      </div>
    )}
    {leftContent && (
      <div
        className="prose prose-zinc max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(leftContent, {
            ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "ul", "ol", "li", "br", "p", "span"],
            ALLOWED_ATTR: ["href", "target", "rel"],
            FORCE_BODY: true,
          }),
        }}
      />
    )}
  </div>  {/* ← THIS WAS MISSING */}

  {/* Right Column */}
  <div className="space-y-6">
    {rightImage && (
      <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden">
        <img src={rightImage} alt="Right column" className="w-full h-full object-cover" />
      </div>
    )}
    {rightContent && (
      <div
        className="prose prose-zinc max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(rightContent, {
            ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "ul", "ol", "li", "br", "p", "span"],
            ALLOWED_ATTR: ["href", "target", "rel"],
            FORCE_BODY: true,
          }),
        }}
      />
    )}
  </div>  {/* ← THIS WAS MISSING */}

</div>
```

Do not change anything else in TwoColumnSection — no props, no styles, 
no logic. Only add the two missing closing tags.

Verify: Run `npm run type-check` after the fix. It must pass with 
zero errors related to TwoColumnSection.

---

### ISSUE 2 — EXPIRED DEFAULT DATE: CountdownBlock defaultProps

File: lib/puck/config.tsx  
Component: CountdownBlock → defaultProps

Current broken code:
```tsx
defaultProps: {
  title: "Limited Time Offer",
  targetDate: "2024-12-31 23:59",  // ← December 2024 is past
  bgColor: "#7c3aed",
  textColor: "#ffffff",
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
},
```

PROBLEM:
Every time a merchant drags a CountdownBlock into the editor, the default 
date is December 2024 — already expired. The CountdownTimer component 
correctly shows "This offer has ended" when expired. So every new 
CountdownBlock shows "This offer has ended" before the merchant even 
configures it. This is confusing and looks broken.

FIX REQUIRED:
Replace the hardcoded "2024-12-31 23:59" with a dynamic default that 
is always 30 days in the future from when the config is initialized.

```tsx
// At the top of the file or near the CountdownBlock definition,
// compute a default target date that is always 30 days from now:
const defaultCountdownDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  // Format as "YYYY-MM-DD HH:MM" to match the field's expected format
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();
```

Then use it in defaultProps:
```tsx
defaultProps: {
  title: "Limited Time Offer",
  targetDate: defaultCountdownDate,  // ← always 30 days from now
  bgColor: "#7c3aed",
  textColor: "#ffffff",
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
},
```

Place the `defaultCountdownDate` constant BEFORE the `config` export 
so it is in scope when defaultProps is evaluated.

Do not change anything else in CountdownBlock.

---

### ISSUE 3 — MOCK DATA: ProductCard Still Uses MockProductCard

File: lib/puck/config.tsx
Component: ProductCard

Current broken render:
```tsx
ProductCard: {
  fields: {
    productId: { type: "text", label: "Product ID (from your store)" },
    showDescription: { ... },
    showBadge: { ... },
    badgeText: { ... },
    badgeColor: { ... },
    showAddToCart: { ... },
    cardStyle: { ... },
  },
  defaultProps: {
    productId: "",
    showDescription: true,
    showBadge: true,
    badgeText: "Featured",
    badgeColor: "#7c3aed",
    showAddToCart: true,
    cardStyle: "default",
  },
  render: ({ showBadge, badgeText, showAddToCart, cardStyle }) => (
    <div className="py-4 px-6 max-w-sm mx-auto">
      <MockProductCard       // ← ALWAYS fake data, ignores productId
        index={0}
        cardStyle={cardStyle}
        showPrice={true}
        showBadge={showBadge}
        badgeText={badgeText}
        showAddToCart={showAddToCart}
      />
    </div>
  ),
},
```

PROBLEM:
The `productId` prop exists but is completely ignored. The component 
always renders a MockProductCard with fake name and price. This appears 
on merchant storefronts.

FIX REQUIRED:
Replace the render function so it:

1. Uses `useStoreId()` to get the current store ID (same pattern as 
   ProductGrid and ProductCarousel already do)
2. Passes `storeId` and `productId` to a real product-fetching component
3. Shows a proper empty state when `productId` is empty (in the editor)

Create a new file: components/puck/product-card-block.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Star, Heart, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  description?: string | null;
}

interface ProductCardBlockProps {
  storeId: string;
  productId: string;
  showDescription: boolean;
  showBadge: boolean;
  badgeText: string;
  badgeColor: string;
  showAddToCart: boolean;
  cardStyle: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductCardBlock({
  storeId,
  productId,
  showDescription,
  showBadge,
  badgeText,
  badgeColor,
  showAddToCart,
  cardStyle,
}: ProductCardBlockProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!storeId || !productId) return;

    setLoading(true);
    setError(false);

    fetch(`/api/storefront/${storeId}/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [storeId, productId]);

  const cardClasses: Record<string, string> = {
    default: "bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300",
    minimal: "bg-transparent group",
    bordered: "bg-white rounded-2xl overflow-hidden border border-zinc-200 group hover:border-violet-300 transition-all duration-300",
    shadow: "bg-white rounded-2xl overflow-hidden shadow-md group hover:shadow-xl transition-all duration-300",
  };

  // Empty state — shown in editor when no productId is set
  if (!productId) {
    return (
      <div className="py-4 px-6 max-w-sm mx-auto">
        <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center">
          <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No product selected</p>
          <p className="text-xs text-zinc-400 mt-1">
            Enter a Product ID in the panel to display a real product
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-4 px-6 max-w-sm mx-auto">
        <div className="bg-zinc-100 rounded-2xl aspect-square animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !product) {
    return (
      <div className="py-4 px-6 max-w-sm mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-red-600">Product not found</p>
          <p className="text-xs text-red-400 mt-1">
            Check the Product ID and try again
          </p>
        </div>
      </div>
    );
  }

  // Real product
  const image = product.images?.[0];
  const priceFormatted = (product.price / 100).toFixed(2); // prices stored in cents

  return (
    <div className="py-4 px-6 max-w-sm mx-auto">
      <div className={cardClasses[cardStyle] ?? cardClasses.default}>
        <div className="relative aspect-square bg-zinc-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-zinc-300" />
            </div>
          )}
          {showBadge && badgeText && (
            <span
              className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: badgeColor }}
            >
              {badgeText}
            </span>
          )}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-violet-50 transition-colors">
              <Heart className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-zinc-900 text-sm mb-1 truncate">
            {product.name}
          </h3>
          {showDescription && product.description && (
            <p className="text-xs text-zinc-500 mb-2 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={4} />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900">${priceFormatted}</span>
            {showAddToCart && (
              <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

Then update the ProductCard render in lib/puck/config.tsx:

```tsx
// Add this import at the top of config.tsx:
import { ProductCardBlock } from "@/components/puck/product-card-block";

// Replace the ProductCard render function:
render: ({ productId, showDescription, showBadge, badgeText, badgeColor, showAddToCart, cardStyle }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const storeId = useStoreId();
  return (
    <ProductCardBlock
      storeId={storeId ?? ""}
      productId={productId}
      showDescription={showDescription}
      showBadge={showBadge}
      badgeText={badgeText}
      badgeColor={badgeColor}
      showAddToCart={showAddToCart}
      cardStyle={cardStyle}
    />
  );
},
```

NOTE: This requires a storefront API route at 
`/api/storefront/[storeId]/products/[productId]` that returns:
```json
{ "id": "...", "name": "...", "price": 2999, "images": ["..."], "description": "..." }
```
If this route does not exist, create it using `getAnonDatabase()` 
(public, no auth required). It must filter:
- `id = productId`
- `store_id = storeId`  
- `is_active = true`
- `deleted_at IS NULL`

Do not expose sensitive fields. Return only: id, name, price, images, description.

---

### ISSUE 4 — CONFIG<ANY>: Replace with Typed Config

File: lib/puck/config.tsx

Current broken line:
```tsx
export const config: Config<any> = {
```

PROBLEM:
`Config<any>` means TypeScript does not check any component props 
against their field definitions. Wrong types, missing required fields, 
and schema mismatches all pass silently.

FIX REQUIRED:
Define a `ComponentMap` type that covers every component's props, 
then type the config as `Config<ComponentMap>`.

Add this block BEFORE the `config` export:

```tsx
// ── Component prop types ───────────────────────────────────────────────────
// One interface per Puck component. Must exactly match the fields defined
// in each component's `fields` object below.

interface AnnouncementBarProps {
  text: string;
  link: string;
  linkText: string;
  bgColor: string;
  textColor: string;
  dismissible: boolean;
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundType: "gradient" | "image" | "color";
  backgroundImage: string;
  gradientFrom: string;
  gradientTo: string;
  bgColor: string;
  overlayOpacity: number;
  textAlign: "left" | "center" | "right";
  minHeight: "sm" | "md" | "lg" | "full";
  ctaText: string;
  ctaLink: string;
  ctaVariant: "default" | "outline" | "white";
  secondaryCtaText: string;
  secondaryCtaLink: string;
  textColor: string;
}

interface SocialProofBarProps {
  stats: Array<{ value: string; label: string }>;
  bgColor: string;
  textColor: string;
}

interface HeadingBlockProps {
  text: string;
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  align: "left" | "center" | "right";
  color: string;
}

interface RichTextBlockProps {
  content: string;
  align: "left" | "center" | "right";
  maxWidth: "narrow" | "medium" | "wide" | "full";
}

interface ButtonBlockProps {
  text: string;
  href: string;
  variant: "primary" | "outline" | "ghost" | "white";
  size: "sm" | "md" | "lg";
  align: "left" | "center" | "right";
  icon: "none" | "arrow" | "cart" | "heart";
  selectorID: string;
  fullWidth: boolean;
}

interface ImageBlockProps {
  src: string;
  alt: string;
  caption: string;
  rounded: "none" | "sm" | "md" | "lg" | "full";
  shadow: boolean;
  aspectRatio: "auto" | "square" | "video" | "portrait";
  align: "left" | "center" | "right";
}

interface VideoBlockProps {
  src: string;
  poster: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  aspectRatio: "video" | "square";
  rounded: "none" | "sm" | "md" | "lg";
}

interface DividerBlockProps {
  style: "solid" | "dashed" | "dotted" | "gradient";
  color: string;
  thickness: number;
  spacing: "sm" | "md" | "lg" | "xl";
}

interface SpacerBlockProps {
  height: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

interface ProductGridProps {
  title: string;
  subtitle: string;
  columns: number;
  gap: "sm" | "md" | "lg";
  cardStyle: "default" | "minimal" | "bordered" | "shadow";
  showPrice: boolean;
  showBadge: boolean;
  badgeText: string;
  showAddToCart: boolean;
  perPage: number;
  showPagination: boolean;
  sort: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc";
  collectionId: string;
  categoryId: string;
  brandId: string;
  tagId: string;
}

interface ProductCarouselProps {
  title: string;
  subtitle: string;
  slidesVisible: number;
  cardStyle: "default" | "minimal" | "bordered";
  showPrice: boolean;
  showAddToCart: boolean;
  showArrows: boolean;
  showDots: boolean;
  autoplay: boolean;
  autoplaySpeed: number;
  limit: number;
  sort: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc";
  collectionId: string;
  categoryId: string;
  brandId: string;
  tagId: string;
}

interface ProductCardProps {
  productId: string;
  showDescription: boolean;
  showBadge: boolean;
  badgeText: string;
  badgeColor: string;
  showAddToCart: boolean;
  cardStyle: "default" | "minimal" | "bordered";
}

interface FeatureSectionProps {
  title: string;
  subtitle: string;
  columns: 2 | 3 | 4;
  layout: "icon-top" | "icon-left" | "card";
  features: Array<{ icon: string; title: string; description: string; color: string }>;
  bgColor: string;
}

interface TestimonialsBlockProps {
  title: string;
  subtitle: string;
  layout: "grid" | "carousel" | "masonry";
  columns: 2 | 3;
  testimonials: Array<{ name: string; role: string; text: string; rating: number; avatar: string }>;
  bgColor: string;
}

interface NewsletterBlockProps {
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
  bgColor: string;
  layout: "inline" | "stacked" | "card";
}

interface BannerBlockProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  textColor: string;
  image: string;
  layout: "left" | "center" | "right";
}

interface FAQBlockProps {
  title: string;
  subtitle: string;
  items: Array<{ question: string; answer: string }>;
  layout: "accordion" | "grid";
}

interface TrustBadgesProps {
  badges: Array<{ icon: string; title: string; subtitle: string }>;
  layout: "horizontal" | "grid";
  bgColor: string;
}

interface SocialLinksProps {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
  align: "left" | "center" | "right";
  size: "sm" | "md" | "lg";
  style: "filled" | "outline" | "ghost";
  color: string;
}

interface CountdownBlockProps {
  title: string;
  targetDate: string;
  bgColor: string;
  textColor: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

interface ImageGalleryProps {
  title: string;
  images: Array<{ src: string; alt: string; caption: string }>;
  columns: 2 | 3 | 4;
  gap: "sm" | "md" | "lg";
  rounded: "none" | "sm" | "md" | "lg";
}

interface ContactSectionProps {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  showForm: boolean;
  bgColor: string;
}

interface TwoColumnSectionProps {
  leftContent: string;
  rightContent: string;
  leftImage: string;
  rightImage: string;
  gap: "sm" | "md" | "lg";
  verticalAlign: "top" | "center" | "bottom";
  reverseOnMobile: boolean;
  leftWidth: "1/3" | "1/2" | "2/3";
}

interface CategoryGridProps {
  title: string;
  subtitle: string;
  categories: Array<{ name: string; image: string; link: string; count: number }>;
  columns: 2 | 3 | 4;
  style: "card" | "overlay" | "minimal";
}

// Single map — every component name maps to its props interface
type ComponentMap = {
  AnnouncementBar:     AnnouncementBarProps;
  HeroSection:         HeroSectionProps;
  SocialProofBar:      SocialProofBarProps;
  HeadingBlock:        HeadingBlockProps;
  RichTextBlock:       RichTextBlockProps;
  ButtonBlock:         ButtonBlockProps;
  ImageBlock:          ImageBlockProps;
  VideoBlock:          VideoBlockProps;
  DividerBlock:        DividerBlockProps;
  SpacerBlock:         SpacerBlockProps;
  ProductGrid:         ProductGridProps;
  ProductCarousel:     ProductCarouselProps;
  ProductCard:         ProductCardProps;
  FeatureSection:      FeatureSectionProps;
  TestimonialsBlock:   TestimonialsBlockProps;
  NewsletterBlock:     NewsletterBlockProps;
  BannerBlock:         BannerBlockProps;
  FAQBlock:            FAQBlockProps;
  TrustBadges:         TrustBadgesProps;
  SocialLinks:         SocialLinksProps;
  CountdownBlock:      CountdownBlockProps;
  ImageGallery:        ImageGalleryProps;
  ContactSection:      ContactSectionProps;
  TwoColumnSection:    TwoColumnSectionProps;
  CategoryGrid:        CategoryGridProps;
};
```

Then change the config declaration:
```tsx
// BEFORE:
export const config: Config<any> = {

// AFTER:
export const config: Config<ComponentMap> = {
```

IMPORTANT — After making this change, run:
```bash
npm run type-check
```

TypeScript will now flag any mismatch between a component's render 
props and its declared interface. Fix every error it reports.

Common errors you will see and how to fix them:
- "Property X does not exist on type Y" → The render function is 
  destructuring a prop not declared in the interface. Add it.
- "Type string is not assignable to type 'left' | 'center' | 'right'"
  → The field type is too broad. Either narrow the interface or cast 
  the value at the render boundary.
- "Argument of type any is not assignable" → The `f()` cast helper 
  uses `any` intentionally for custom fields. This is acceptable — 
  add `// eslint-disable-next-line` only where the cast is on the 
  custom field helper, not on the render function itself.

Do not suppress TypeScript errors with `as any` in render functions.
Fix them properly.

---

## VERIFICATION STEPS — RUN AFTER ALL 4 FIXES

Run these commands in order. All must pass before you are done:

```bash
# 1. Type check — zero errors
npm run type-check

# 2. Lint — zero errors  
npm run lint

# 3. Build — must succeed
npm run build
```

If type-check or build fails, fix the errors before committing.
Do not commit broken code.

---

## RULES FOR THIS TASK

1. Fix exactly the 4 issues described. No extra refactoring.
2. Do not touch any API route — they are already correct.
3. Do not touch renderer.tsx, countdown-timer.tsx, popups/page.tsx, 
   or templates-client.tsx — they are already correct.
4. After fixing Issue 4 (Config<any>), if TypeScript reveals 
   additional type errors in render functions, fix those too — 
   they are pre-existing bugs that were hidden by Config<any>.
5. Every fix must be in the correct file at the correct location.
6. Do not add console.log statements.
7. Do not change CSS classes or UI unless a fix explicitly requires it.

---

## SUMMARY OF FILES YOU WILL TOUCH

| File | What to change |
|---|---|
| lib/puck/config.tsx | Fix TwoColumnSection JSX, fix CountdownBlock default date, replace ProductCard render, replace Config<any> with Config<ComponentMap>, add all interfaces |
| components/puck/product-card-block.tsx | CREATE this new file |
| app/api/storefront/[storeId]/products/[productId]/route.ts | CREATE if it doesn't exist |

That is all. Nothing else.