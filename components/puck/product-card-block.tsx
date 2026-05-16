"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Star, Heart, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  images?: string[] | { url: string; alt?: string }[] | null;
  description?: string | null;
}

function resolveImageUrl(product: Product): string | null {
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "url" in first) return first.url;
  }
  if (product.image) return product.image;
  return null;
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

export interface ProductCardBlockProps {
  storeId: string;
  productId: string;
  showDescription: boolean;
  showBadge: boolean;
  badgeText: string;
  badgeColor: string;
  showAddToCart: boolean;
  cardStyle: string;
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
    default:  "bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300",
    minimal:  "bg-transparent group",
    bordered: "bg-white rounded-2xl overflow-hidden border border-zinc-200 group hover:border-violet-300 transition-all duration-300",
    shadow:   "bg-white rounded-2xl overflow-hidden shadow-md group hover:shadow-xl transition-all duration-300",
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
      <div className="py-4 px-6 max-w-sm mx-auto animate-pulse">
        <div className="bg-zinc-200 rounded-2xl aspect-square" />
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-zinc-200 rounded w-3/4" />
          <div className="h-4 bg-zinc-200 rounded w-1/2" />
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
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

  const imageUrl = resolveImageUrl(product);
  const priceFormatted = (product.price / 100).toFixed(2);

  return (
    <div className="py-4 px-6 max-w-sm mx-auto">
      <div className={cardClasses[cardStyle] ?? cardClasses.default}>
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
            <span
              className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: badgeColor }}
            >
              {badgeText}
            </span>
          )}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-violet-50 transition-colors"
              aria-label={`Add ${product.name} to wishlist`}
            >
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
