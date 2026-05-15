"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingCart, Star, Heart, Package, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: number;
  /** Legacy single-image field (text) */
  image?: string | null;
  /** Multi-image field (jsonb array of URLs or {url,alt} objects) */
  images?: string[] | { url: string; alt?: string }[] | null;
  slug: string;
}

/** Resolve the first displayable image URL from either field */
function resolveImageUrl(product: Product): string | null {
  // Try images array first (richer field)
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "url" in first) return first.url;
  }
  // Fall back to legacy single image
  if (product.image) return product.image;
  return null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── Shared filter params ─────────────────────────────────────────────────────

export interface ProductFilterParams {
  collectionId?: string;
  categoryId?: string;
  brandId?: string;
  tagId?: string;
  sort?: string;
}

// ─── Shared fetch helper ──────────────────────────────────────────────────────

function buildProductUrl(
  storeId: string,
  filters: ProductFilterParams,
  page: number,
  limit: number
): string {
  const p = new URLSearchParams();
  p.set("page",  String(page));
  p.set("limit", String(limit));
  if (filters.collectionId) p.set("collectionId", filters.collectionId);
  if (filters.categoryId)   p.set("categoryId",   filters.categoryId);
  if (filters.brandId)      p.set("brandId",       filters.brandId);
  if (filters.tagId)        p.set("tagId",         filters.tagId);
  if (filters.sort)         p.set("sort",          filters.sort);
  return `/api/storefront/${storeId}/products?${p.toString()}`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  cardStyle: string;
  showPrice: boolean;
  showBadge: boolean;
  badgeText: string;
  showAddToCart: boolean;
}

function ProductCard({
  product,
  cardStyle,
  showPrice,
  showBadge,
  badgeText,
  showAddToCart,
}: ProductCardProps) {
  const cardClasses: Record<string, string> = {
    default:  "bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300",
    minimal:  "bg-transparent group",
    bordered: "bg-white rounded-2xl overflow-hidden border border-zinc-200 group hover:border-violet-300 transition-all duration-300",
    shadow:   "bg-white rounded-2xl overflow-hidden shadow-md group hover:shadow-xl transition-all duration-300",
  };

  const imageUrl = resolveImageUrl(product);

  return (
    <div className={cardClasses[cardStyle] ?? cardClasses.default}>
      <a
        href={product.slug ? `/products/${product.slug}` : "#"}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square bg-linear-to-br from-zinc-100 to-zinc-200 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-12 h-12 text-zinc-300" />
            </div>
          )}
          {showBadge && badgeText && (
            <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {badgeText}
            </span>
          )}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-violet-50 transition-colors"
              aria-label={`Add ${product.name} to wishlist`}
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
      </a>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 text-sm mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={4} />
        </div>
        {showPrice && (
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900">
              ${(product.price / 100).toFixed(2)}
            </span>
            {showAddToCart && (
              <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-zinc-200 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 rounded w-1/2" />
        <div className="h-4 bg-zinc-200 rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────

interface PaginationBarProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

function PaginationBar({ pagination, onPageChange }: PaginationBarProps) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  // Show at most 5 page numbers around current
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav
      className="flex items-center justify-center gap-1 mt-10"
      aria-label="Product pagination"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-zinc-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? "bg-violet-600 text-white"
                : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// ─── ProductGrid ──────────────────────────────────────────────────────────────

export interface ProductGridProps {
  storeId: string;
  title: string;
  subtitle: string;
  columns: number;
  gap: string;
  cardStyle: string;
  showPrice: boolean;
  showBadge: boolean;
  badgeText: string;
  showAddToCart: boolean;
  /** Products per page */
  perPage: number;
  showPagination: boolean;
  // Filters — IDs selected in the Puck editor
  collectionId?: string;
  categoryId?: string;
  brandId?: string;
  tagId?: string;
  sort?: string;
}

export function ProductGrid({
  storeId,
  title,
  subtitle,
  columns,
  gap,
  cardStyle,
  showPrice,
  showBadge,
  badgeText,
  showAddToCart,
  perPage,
  showPagination,
  collectionId,
  categoryId,
  brandId,
  tagId,
  sort,
}: ProductGridProps) {
  const [products, setProducts]     = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading]   = useState(true);

  const filters: ProductFilterParams = { collectionId, categoryId, brandId, tagId, sort };

  const fetchProducts = useCallback(
    (page: number) => {
      if (!storeId) { setIsLoading(false); return; }
      setIsLoading(true);
      fetch(buildProductUrl(storeId, filters, page, perPage))
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((data) => {
          setProducts(Array.isArray(data?.items) ? data.items : []);
          setPagination(data?.pagination ?? null);
        })
        .catch((err) => console.error("[ProductGrid] fetch error:", err))
        .finally(() => setIsLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeId, perPage, collectionId, categoryId, brandId, tagId, sort]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page);
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const colMap: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  const gapMap: Record<string, string> = { sm: "gap-3", md: "gap-6", lg: "gap-8" };

  return (
    <div className="py-12 px-6">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title    && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-2">{title}</h2>}
          {subtitle && <p className="text-zinc-500">{subtitle}</p>}
        </div>
      )}

      <div className={`grid ${colMap[columns] ?? colMap[3]} ${gapMap[gap] ?? gapMap.md} max-w-7xl mx-auto`}>
        {isLoading
          ? Array.from({ length: Math.min(perPage, 12) }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length === 0
          ? (
            <div className="col-span-full text-center py-16 text-zinc-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          )
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cardStyle={cardStyle}
                showPrice={showPrice}
                showBadge={showBadge}
                badgeText={badgeText}
                showAddToCart={showAddToCart}
              />
            ))
        }
      </div>

      {showPagination && pagination && (
        <PaginationBar pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Result count */}
      {!isLoading && pagination && pagination.total > 0 && (
        <p className="text-center text-xs text-zinc-400 mt-4">
          Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, pagination.total)} of {pagination.total} products
        </p>
      )}
    </div>
  );
}

// ─── ProductCarousel ──────────────────────────────────────────────────────────

export interface ProductCarouselProps {
  storeId: string;
  title: string;
  subtitle: string;
  slidesVisible: number;
  cardStyle: string;
  showPrice: boolean;
  showAddToCart: boolean;
  showArrows: boolean;
  showDots: boolean;
  autoplay: boolean;
  autoplaySpeed: number;
  /** Max products to fetch for the carousel */
  limit: number;
  // Filters
  collectionId?: string;
  categoryId?: string;
  brandId?: string;
  tagId?: string;
  sort?: string;
}

export function ProductCarousel({
  storeId,
  title,
  subtitle,
  slidesVisible,
  cardStyle,
  showPrice,
  showAddToCart,
  showArrows,
  showDots,
  autoplay,
  autoplaySpeed,
  limit,
  collectionId,
  categoryId,
  brandId,
  tagId,
  sort,
}: ProductCarouselProps) {
  const [products, setProducts]       = useState<Product[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filters: ProductFilterParams = { collectionId, categoryId, brandId, tagId, sort };

  useEffect(() => {
    if (!storeId) { setIsLoading(false); return; }
    setIsLoading(true);
    setCurrentIndex(0);
    fetch(buildProductUrl(storeId, filters, 1, limit))
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => setProducts(Array.isArray(data?.items) ? data.items : []))
      .catch((err) => console.error("[ProductCarousel] fetch error:", err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, limit, collectionId, categoryId, brandId, tagId, sort]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || products.length <= slidesVisible) return;
    const maxIdx = Math.max(0, products.length - slidesVisible);
    const id = setInterval(() => {
      setCurrentIndex((i) => (i >= maxIdx ? 0 : i + 1));
    }, autoplaySpeed);
    return () => clearInterval(id);
  }, [autoplay, autoplaySpeed, products.length, slidesVisible]);

  const maxIndex = Math.max(0, products.length - slidesVisible);
  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const next = () => setCurrentIndex((i) => Math.min(maxIndex, i + 1));

  const colMap: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
  const visibleProducts = products.slice(currentIndex, currentIndex + slidesVisible);

  return (
    <div className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            {title    && <h2 className="text-3xl font-heading font-bold text-zinc-900">{title}</h2>}
            {subtitle && <p className="text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          {showArrows && products.length > slidesVisible && (
            <div className="flex gap-2">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors disabled:opacity-40"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <button
                onClick={next}
                disabled={currentIndex >= maxIndex}
                className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors disabled:opacity-40"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
          )}
        </div>

        <div className={`grid ${colMap[slidesVisible] ?? colMap[3]} gap-6`}>
          {isLoading
            ? Array.from({ length: slidesVisible }).map((_, i) => <ProductCardSkeleton key={i} />)
            : visibleProducts.length === 0
            ? (
              <div className="col-span-full text-center py-12 text-zinc-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            )
            : visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cardStyle={cardStyle}
                  showPrice={showPrice}
                  showBadge={false}
                  badgeText=""
                  showAddToCart={showAddToCart}
                />
              ))
          }
        </div>

        {showDots && products.length > slidesVisible && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-violet-600" : "bg-zinc-300"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
