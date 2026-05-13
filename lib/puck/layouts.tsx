import { Config, Data } from "@puckeditor/core";
import { config as defaultConfig } from "./config";

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  config: Config;
}

// All layouts share the same full config — layout selection just sets a starter template
const allLayouts: LayoutConfig[] = [
  { id: "default", name: "Default", description: "Full component set", config: defaultConfig },
  { id: "minimal", name: "Minimal", description: "Content-focused pages", config: defaultConfig },
  { id: "landing", name: "Landing Page", description: "Conversion-optimized", config: defaultConfig },
  { id: "store", name: "Store Page", description: "Product-focused layout", config: defaultConfig },
];

export const layouts = allLayouts;

export function getLayoutConfig(): Config {
  return defaultConfig;
}

// Starter templates for new pages
export function getLayoutTemplate(layoutId: string): Data {
  const templates: Record<string, Data> = {
    landing: {
      content: [
        {
          type: "AnnouncementBar",
          props: { id: "ann-1", text: "🎉 Free shipping on orders over $50!", link: "", linkText: "Shop Now", bgColor: "#7c3aed", textColor: "#ffffff", dismissible: true },
        },
        {
          type: "HeroSection",
          props: { id: "hero-1", title: "Welcome to Our Store", subtitle: "Discover amazing products at unbeatable prices.", backgroundType: "gradient", backgroundImage: "", gradientFrom: "#7c3aed", gradientTo: "#4f46e5", overlayOpacity: 40, textAlign: "center", minHeight: "lg", ctaText: "Shop Now", ctaLink: "/products", ctaVariant: "default", secondaryCtaText: "Learn More", secondaryCtaLink: "/about" },
        },
        {
          type: "SocialProofBar",
          props: { id: "stats-1", stats: [{ value: "10K+", label: "Happy Customers" }, { value: "500+", label: "Products" }, { value: "99%", label: "Satisfaction" }, { value: "24/7", label: "Support" }], bgColor: "#18181b", textColor: "#ffffff" },
        },
        {
          type: "ProductGrid",
          props: { id: "grid-1", title: "Featured Products", subtitle: "Handpicked just for you", columns: 3, gap: "md", cardStyle: "default", showPrice: true, showBadge: true, badgeText: "New", showAddToCart: true, limit: 6 },
        },
        {
          type: "FeatureSection",
          props: { id: "feat-1", title: "Why Choose Us", subtitle: "Everything you need, nothing you don't", columns: 3, layout: "icon-top", features: [{ icon: "🚚", title: "Free Shipping", description: "Free shipping on all orders over $50." }, { icon: "🔒", title: "Secure Payments", description: "Your payment info is always safe." }, { icon: "↩️", title: "Easy Returns", description: "30-day hassle-free returns." }] },
        },
        {
          type: "TestimonialsBlock",
          props: { id: "test-1", title: "What Our Customers Say", subtitle: "Trusted by thousands", layout: "grid", columns: 3, testimonials: [{ name: "Sarah M.", role: "Verified Buyer", text: "Absolutely love the quality! Fast shipping.", rating: 5, avatar: "" }, { name: "James K.", role: "Verified Buyer", text: "Best purchase I've made this year.", rating: 5, avatar: "" }, { name: "Priya L.", role: "Verified Buyer", text: "Great customer service. Highly recommend!", rating: 4, avatar: "" }] },
        },
        {
          type: "CountdownBlock",
          props: { id: "countdown-1", title: "Limited Time Offer", targetDate: "2026-12-31 23:59", bgColor: "#7c3aed", textColor: "#ffffff", showDays: true, showHours: true, showMinutes: true, showSeconds: true },
        },
        {
          type: "CategoryGrid",
          props: { id: "cat-1", title: "Shop by Category", subtitle: "Discover our curated collections", categories: [{ name: "Electronics", image: "", link: "/category/electronics", count: 45 }, { name: "Fashion", image: "", link: "/category/fashion", count: 128 }, { name: "Home & Garden", image: "", link: "/category/home", count: 67 }], columns: 3, style: "card" },
        },
        {
          type: "NewsletterBlock",
          props: { id: "news-1", title: "Stay in the Loop", subtitle: "Get exclusive deals straight to your inbox.", placeholder: "Enter your email", buttonText: "Subscribe", bgColor: "#f4f4f5", layout: "inline" },
        },
      ],
      root: { props: {} },
    },
    store: {
      content: [
        {
          type: "ProductCarousel",
          props: { id: "car-1", title: "New Arrivals", subtitle: "Fresh styles just dropped", slidesVisible: 3, cardStyle: "default", showPrice: true, showAddToCart: true, showArrows: true, showDots: true, autoplay: false, autoplaySpeed: 3000 },
        },
        {
          type: "CategoryGrid",
          props: { id: "cat-1", title: "Shop by Category", subtitle: "Find what you're looking for", categories: [{ name: "Best Sellers", image: "", link: "/category/best-sellers", count: 25 }, { name: "New Arrivals", image: "", link: "/category/new", count: 18 }, { name: "Sale Items", image: "", link: "/category/sale", count: 32 }], columns: 3, style: "overlay" },
        },
        {
          type: "ProductGrid",
          props: { id: "grid-1", title: "All Products", subtitle: "", columns: 4, gap: "md", cardStyle: "default", showPrice: true, showBadge: false, badgeText: "", showAddToCart: true, limit: 8 },
        },
        {
          type: "TrustBadges",
          props: { id: "trust-1", badges: [{ icon: "🔒", title: "Secure Checkout", subtitle: "SSL Protected" }, { icon: "🚚", title: "Free Shipping", subtitle: "Orders over $50" }, { icon: "↩️", title: "Easy Returns", subtitle: "30-day policy" }], layout: "horizontal", bgColor: "#f9fafb" },
        },
      ],
      root: { props: {} },
    },
    default: {
      content: [
        {
          type: "HeroSection",
          props: { id: "hero-1", title: "Welcome", subtitle: "Start building your page.", backgroundType: "gradient", backgroundImage: "", gradientFrom: "#7c3aed", gradientTo: "#4f46e5", overlayOpacity: 40, textAlign: "center", minHeight: "md", ctaText: "Get Started", ctaLink: "#", ctaVariant: "default", secondaryCtaText: "", secondaryCtaLink: "" },
        },
      ],
      root: { props: {} },
    },
    minimal: {
      content: [
        {
          type: "HeadingBlock",
          props: { id: "h-1", text: "Page Title", level: "h1", size: "2xl", align: "center", color: "" },
        },
        {
          type: "RichTextBlock",
          props: { id: "txt-1", content: "Add your content here.", align: "center", maxWidth: "narrow" },
        },
      ],
      root: { props: {} },
    },
  };
  return templates[layoutId] || templates.default;
}
