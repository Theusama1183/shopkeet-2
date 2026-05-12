"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, Package, Box, ShoppingBag, Users, Tag, Palette,
  Megaphone, BarChart3, Tablet, Puzzle, Settings, Bell,
  HelpCircle, ChevronDown, MoreVertical, List, Plus, Layers,
  FolderTree, Building2, Bookmark, Database, ArrowLeftRight, Warehouse,
  Truck, FileText, ShoppingCart, Undo2, Ticket, Zap, Gift, Brush,
  Navigation, Newspaper, TrendingUp, Mail, Globe2, Share2, DollarSign,
  Percent, Coins, SlidersHorizontal, MapPin, Globe, Languages, CreditCard,
  Receipt, BadgeDollarSign, FileSpreadsheet, Route, Clock, UserPlus, Lock,
  ShieldCheck, Smartphone, Webhook, FileBadge, Cookie, Code2, Trash2, Antenna,
  Store,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BadgeVariant = "purple" | "red" | "green";

interface NavLeaf {
  label: string;
  href: string;
  icon?: React.ElementType;
  danger?: boolean;
}

interface NavSubGroup {
  label: string;
  icon?: React.ElementType;
  children: NavLeaf[];
}

interface NavTopItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  children?: (NavLeaf | NavSubGroup)[];
}

interface NavSection {
  label: string | null;
  items: NavTopItem[];
}

// ── Nav data ──────────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main Menu",
    items: [
      { id: "home", icon: LayoutDashboard, label: "Dashboard", href: "" },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        id: "products",
        icon: Package,
        label: "Products",
        badge: "84",
        badgeVariant: "purple",
        children: [
          { label: "All products", href: "/products", icon: List },
          { label: "Add product", href: "/products/new", icon: Plus },
          { label: "Collections", href: "/collections", icon: Layers },
          { label: "Categories", href: "/categories", icon: FolderTree },
          { label: "Brands", href: "/brands", icon: Building2 },
          { label: "Tags", href: "/tags", icon: Bookmark },
        ],
      },
      {
        id: "inventory",
        icon: Box,
        label: "Inventory",
        children: [
          { label: "Stock levels", href: "/inventory", icon: Database },
          { label: "Transfers", href: "/inventory/transfers", icon: ArrowLeftRight },
          { label: "Warehouses", href: "/inventory/warehouses", icon: Warehouse },
          { label: "Suppliers", href: "/suppliers", icon: Truck },
        ],
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        id: "orders",
        icon: ShoppingBag,
        label: "Orders",
        badge: "12",
        badgeVariant: "red",
        children: [
          { label: "All orders", href: "/orders", icon: List },
          { label: "Drafts", href: "/orders/drafts", icon: FileText },
          { label: "Abandoned carts", href: "/orders/abandoned", icon: ShoppingCart },
          { label: "Returns & refunds", href: "/orders/returns", icon: Undo2 },
        ],
      },
      { id: "customers", icon: Users, label: "Customers", href: "/customers" },
      {
        id: "discounts",
        icon: Tag,
        label: "Discounts",
        children: [
          { label: "Promo codes", href: "/discounts/codes", icon: Ticket },
          { label: "Automatic discounts", href: "/discounts/automatic", icon: Zap },
          { label: "Gift cards", href: "/discounts/gifts", icon: Gift },
        ],
      },
    ],
  },
  {
    label: "Storefront",
    items: [
      {
        id: "design",
        icon: Palette,
        label: "Design",
        children: [
          { label: "Themes", href: "/design/themes", icon: Brush },
          { label: "Pages", href: "/pages", icon: FileText },
          { label: "Navigation", href: "/design/navigation", icon: Navigation },
          { label: "Popups & banners", href: "/design/popups", icon: Layers },
          { label: "Blog", href: "/blog", icon: Newspaper },
        ],
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        id: "marketing",
        icon: Megaphone,
        label: "Marketing",
        children: [
          { label: "Campaigns", href: "/marketing/campaigns", icon: TrendingUp },
          { label: "Email marketing", href: "/marketing/email", icon: Mail },
          { label: "SEO", href: "/marketing/seo", icon: Globe2 },
          { label: "Social integrations", href: "/marketing/social", icon: Share2 },
        ],
      },
      {
        id: "analytics",
        icon: BarChart3,
        label: "Analytics",
        children: [
          { label: "Overview", href: "/analytics", icon: LayoutDashboard },
          { label: "Sales report", href: "/analytics/sales", icon: DollarSign },
          { label: "Traffic", href: "/analytics/traffic", icon: Antenna },
          { label: "Conversions", href: "/analytics/conversions", icon: Percent },
          { label: "Finance", href: "/analytics/finance", icon: Coins },
        ],
      },
    ],
  },
  {
    label: "Channels",
    items: [
      { id: "pos",          icon: Tablet,  label: "Point of Sale", href: "/pos",          badge: "Live", badgeVariant: "green" },
      { id: "online-store", icon: Store,   label: "Online store",  href: "/online-store" },
      { id: "apps",         icon: Puzzle,  label: "App store",     href: "/apps"         },
    ],
  },
  {
    label: null,
    items: [
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        children: [
          {
            label: "General", icon: SlidersHorizontal,
            children: [
              { label: "Store details", href: "/settings/store", icon: FileText },
              { label: "Locations", href: "/settings/locations", icon: MapPin },
              { label: "Domains", href: "/settings/domains", icon: Globe },
              { label: "Languages", href: "/settings/languages", icon: Languages },
            ],
          },
          {
            label: "Payments", icon: CreditCard,
            children: [
              { label: "Payment providers", href: "/settings/payments", icon: CreditCard },
              { label: "Checkout", href: "/settings/checkout", icon: Receipt },
              { label: "Currencies", href: "/settings/currencies", icon: BadgeDollarSign },
              { label: "Tax & VAT", href: "/settings/tax", icon: FileSpreadsheet },
            ],
          },
          {
            label: "Shipping", icon: Truck,
            children: [
              { label: "Shipping zones", href: "/settings/shipping", icon: Route },
              { label: "Packaging", href: "/settings/packaging", icon: Package },
              { label: "Delivery rates", href: "/settings/delivery", icon: Clock },
            ],
          },
          {
            label: "Team & permissions", icon: Users,
            children: [
              { label: "Staff accounts", href: "/settings/staff", icon: UserPlus },
              { label: "Roles", href: "/settings/roles", icon: Lock },
              { label: "Two-step auth", href: "/settings/2fa", icon: ShieldCheck },
            ],
          },
          {
            label: "Notifications", icon: Bell,
            children: [
              { label: "Email templates", href: "/settings/notifications/email", icon: Mail },
              { label: "SMS alerts", href: "/settings/notifications/sms", icon: Smartphone },
              { label: "Webhooks", href: "/settings/webhooks", icon: Webhook },
            ],
          },
          {
            label: "Legal", icon: FileBadge,
            children: [
              { label: "Privacy policy", href: "/settings/legal/privacy", icon: FileText },
              { label: "Terms of service", href: "/settings/legal/terms", icon: FileText },
              { label: "Cookie policy", href: "/settings/legal/cookies", icon: Cookie },
            ],
          },
          { label: "API & integrations", href: "/settings/api", icon: Code2 },
          { label: "Delete store", href: "/settings/delete", icon: Trash2, danger: true },
        ],
      },
    ],
  },
];

// ── Badge styles ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeVariant, string> = {
  purple: "bg-violet-100 text-violet-700",
  red: "bg-red-100 text-red-700",
  green: "bg-emerald-100 text-emerald-700",
};

// ── 3rd-level leaf ────────────────────────────────────────────────────────────

function SubSubNavItem({ item, base }: { item: NavLeaf; base: string }) {
  const pathname = usePathname();
  const active = pathname === `${base}${item.href}`;
  const Icon = item.icon;

  return (
    <Link
      href={`${base}${item.href}`}
      className={cn(
        "flex items-center gap-2 pl-12 pr-3 py-1 rounded-lg text-xs transition-colors",
        active
          ? "text-violet-700 font-medium"
          : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
      )}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {item.label}
    </Link>
  );
}

// ── 2nd-level item (leaf or sub-group) ────────────────────────────────────────

function SubNavItem({
  item,
  base,
  openSubId,
  onToggleSub,
}: {
  item: NavLeaf | NavSubGroup;
  base: string;
  openSubId: string | null;
  onToggleSub: (label: string) => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = "children" in item && Array.isArray(item.children) && item.children.length > 0;
  const isOpen = openSubId === item.label;

  if (hasChildren) {
    const subGroup = item as NavSubGroup;
    const anyChildActive = subGroup.children.some(
      (c) => pathname === `${base}${c.href}`
    );
    return (
      <div>
        <button
          onClick={() => onToggleSub(item.label)}
          className={cn(
            "w-full flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-xs transition-colors text-left",
            anyChildActive
              ? "text-violet-700 font-medium"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
          <span className="flex-1 truncate">{item.label}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 shrink-0 text-zinc-300 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        <div
          className="overflow-hidden transition-all duration-200"
          style={{ maxHeight: isOpen ? `${subGroup.children.length * 28}px` : "0px" }}
        >
          {subGroup.children.map((child) => (
            <SubSubNavItem key={child.label} item={child} base={base} />
          ))}
        </div>
      </div>
    );
  }

  // Leaf
  const leaf = item as NavLeaf;
  const active = leaf.href ? pathname === `${base}${leaf.href}` : false;
  return (
    <Link
      href={leaf.href ? `${base}${leaf.href}` : "#"}
      className={cn(
        "flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-xs transition-colors",
        leaf.danger
          ? "text-red-500 hover:bg-red-50"
          : active
            ? "text-violet-700 font-medium bg-violet-50"
            : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
      )}
    >
      {Icon && (
        <Icon className={cn("w-3.5 h-3.5 shrink-0", leaf.danger ? "text-red-400" : "")} />
      )}
      {leaf.label}
    </Link>
  );
}

// ── Top-level nav item ────────────────────────────────────────────────────────

function NavItem({
  item,
  base,
  isCollapsed,
  openGroupId,
  onToggleGroup,
}: {
  item: NavTopItem;
  base: string;
  isCollapsed: boolean;
  openGroupId: string | null;
  onToggleGroup: (id: string) => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isOpen = openGroupId === item.id;

  const [openSubId, setOpenSubId] = useState<string | null>(null);
  const handleToggleSub = useCallback(
    (label: string) => setOpenSubId((prev) => (prev === label ? null : label)),
    []
  );

  const isActive = item.href !== undefined
    ? item.href === "" ? pathname === base : pathname.startsWith(`${base}${item.href}`)
    : hasChildren && item.children!.some((c) =>
      "href" in c && c.href
        ? pathname.startsWith(`${base}${c.href}`)
        : "children" in c && (c as NavSubGroup).children?.some(
          (cc) => cc.href && pathname.startsWith(`${base}${cc.href}`)
        )
    );

  const badge = item.badge ? (
    <span className={cn(
      "text-[10px] font-medium rounded-full px-1.5 py-2.5 leading-none",
      BADGE_STYLES[item.badgeVariant ?? "purple"]
    )}>
      {item.badge}
    </span>
  ) : null;

  // ── Leaf (no children) ────────────────────────────────────────────────────
  if (!hasChildren) {
    return (
      <div className="group relative">
        <Link
          href={`${base}${item.href ?? ""}`}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] transition-colors relative",
            isActive
              ? "bg-violet-50 text-violet-700 font-medium"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
          )}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4.5 bg-violet-600 rounded-r-full" />
          )}
          <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-violet-600" : "text-zinc-400")} />
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {badge}
            </>
          )}
        </Link>
        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {item.label}
          </div>
        )}
      </div>
    );
  }

  // ── Accordion (has children) ──────────────────────────────────────────────
  // Calculate max-height for smooth animation
  const childrenMaxH = item.children!.reduce((acc: number, c) => {
    const isSubGroup = "children" in c && !("href" in c);
    return acc + 28 + (isSubGroup ? (c as NavSubGroup).children.length * 28 : 0);
  }, 0);

  return (
    <div>
      <button
        onClick={() => onToggleGroup(item.id)}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] transition-colors relative text-left",
          isOpen || isActive
            ? "bg-violet-50 text-violet-700 font-medium"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        )}
      >
        {(isOpen || isActive) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4.5 bg-violet-600 rounded-r-full" />
        )}
        <Icon className={cn("w-4 h-4 shrink-0", isOpen || isActive ? "text-violet-600" : "text-zinc-400")} />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {badge}
            <ChevronDown className={cn(
              "w-3.5 h-3.5 shrink-0 text-zinc-300 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </>
        )}
      </button>

      {!isCollapsed && (
        <div
          className="overflow-hidden transition-all duration-250 ease-in-out"
          style={{ maxHeight: isOpen ? `${childrenMaxH}px` : "0px" }}
        >
          <div className="mt-0.5 space-y-px">
            {item.children!.map((child) => (
              <SubNavItem
                key={child.label}
                item={child}
                base={base}
                openSubId={openSubId}
                onToggleSub={handleToggleSub}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar props ─────────────────────────────────────────────────────────────

interface SidebarProps {
  storeId: string;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  storeName?: string;
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar({
  storeId,
  isCollapsed,
  onToggle,
  isMobile = false,
  storeName = "My Store",
}: SidebarProps) {
  const base = `/store/${storeId}`;
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const handleToggleGroup = useCallback(
    (id: string) => setOpenGroupId((prev) => (prev === id ? null : id)),
    []
  );

  return (
    <>
      {isMobile && !isCollapsed && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onToggle} />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-zinc-100 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-60",
        isMobile && isCollapsed && "-translate-x-full",
        isMobile && !isCollapsed && "translate-x-0 shadow-2xl"
      )}>

        {/* ── Header ── */}
        <div className="h-13 flex items-center justify-between px-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-zinc-100 shrink-0">
              {isCollapsed
                ? <Logo variant="icon" size="sm" iconColor="#7c3aed" />
                : <Logo variant="full" size="sm" iconColor="#7c3aed" textColor="#18181b" />
              }
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-1 px-2">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.label && !isCollapsed && (
                <p className="px-2.5 pt-3 pb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              {si > 0 && isCollapsed && (
                <div className="my-1 mx-2 h-px bg-zinc-100" />
              )}
              <div className="space-y-2.5 ">
                {section.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    base={base}
                    isCollapsed={isCollapsed}
                    openGroupId={openGroupId}
                    onToggleGroup={handleToggleGroup}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-zinc-100 p-2">
          <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-50 transition-colors text-left">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-violet-700">
                {storeName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate">{storeName}</p>
                  <p className="text-[10px] text-zinc-400 truncate">Store Owner · Admin</p>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
