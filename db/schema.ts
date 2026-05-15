import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  jsonb,
  index,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull().unique(),
    image: text("image"),
    emailVerified: boolean("email_verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("users_email_idx").on(table.email),
  ]
);

// ─── Stores ───────────────────────────────────────────────────────────────────

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    subdomain: text("subdomain").unique().notNull(),
    customDomain: text("custom_domain").unique(),
    logo: text("logo"),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("stores_subdomain_idx").on(table.subdomain),
    index("stores_custom_domain_idx").on(table.customDomain),
    index("stores_user_id_idx").on(table.userId),
    // Filter active stores efficiently
    index("stores_user_id_active_idx").on(table.userId, table.isActive),
    index("stores_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Collections ──────────────────────────────────────────────────────────────

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    image: text("image"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("collections_store_id_idx").on(table.storeId),
    index("collections_slug_idx").on(table.slug),
    index("collections_store_id_active_idx").on(table.storeId, table.isActive),
    index("collections_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    image: text("image"),
    parentId: uuid("parent_id"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("categories_store_id_idx").on(table.storeId),
    index("categories_slug_idx").on(table.slug),
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_store_id_active_idx").on(table.storeId, table.isActive),
    index("categories_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    logo: text("logo"),
    website: text("website"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("brands_store_id_idx").on(table.storeId),
    index("brands_slug_idx").on(table.slug),
    index("brands_store_id_active_idx").on(table.storeId, table.isActive),
    index("brands_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color").default("#6366f1"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("tags_store_id_idx").on(table.storeId),
    index("tags_slug_idx").on(table.slug),
    index("tags_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(), // stored in cents
    image: text("image"),
    sku: text("sku"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("products_store_id_idx").on(table.storeId),
    index("products_sku_idx").on(table.sku),
    index("products_collection_id_idx").on(table.collectionId),
    index("products_category_id_idx").on(table.categoryId),
    index("products_brand_id_idx").on(table.brandId),
    // Composite index for active product listings (most common query)
    index("products_store_id_active_idx").on(table.storeId, table.isActive),
    // Soft-delete filter
    index("products_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Product Tags (Many-to-Many) ──────────────────────────────────────────────

export const productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId] }),
    index("product_tags_product_id_idx").on(table.productId),
    index("product_tags_tag_id_idx").on(table.tagId),
  ]
);

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5),
    trackInventory: boolean("track_inventory").default(true).notNull(),
    allowBackorder: boolean("allow_backorder").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    unique("inventory_product_store_unique").on(table.productId, table.storeId),
    index("inventory_product_id_idx").on(table.productId),
    index("inventory_store_id_idx").on(table.storeId),
    index("inventory_quantity_idx").on(table.quantity),
  ]
);

// ─── Pages ────────────────────────────────────────────────────────────────────

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: jsonb("content").notNull(), // Puck data
    layoutId: text("layout_id").default("default").notNull(),
    isHome: boolean("is_home").default(false).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    // Slug lookup (most critical — used on every storefront page request)
    index("pages_store_id_slug_idx").on(table.storeId, table.slug),
    index("pages_store_id_idx").on(table.storeId),
    index("pages_slug_idx").on(table.slug),
    // Home page lookup
    index("pages_store_id_home_idx").on(table.storeId, table.isHome),
    // Published pages filter (storefront listing)
    index("pages_store_id_published_idx").on(table.storeId, table.isPublished),
    // Soft-delete filter
    index("pages_deleted_at_idx").on(table.deletedAt),
    // Combined: most common storefront query
    index("pages_store_slug_published_idx").on(table.storeId, table.slug, table.isPublished),
  ]
);

// ─── Templates ────────────────────────────────────────────────────────────────
//
// Global layout templates for the storefront.
// Supported types:
//   header           — top of every page
//   footer           — bottom of every page
//   single-product   — /products/[slug]
//   archive-products — /products
//   single-post      — /blog/[slug]
//   archive-blog     — /blog
//   cart             — /cart
//   search           — /search
//   not-found        — 404 page
//
// Only one template per type per store can be isActive = true at a time.

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    content: jsonb("content").notNull().default("{}"),
    isActive: boolean("is_active").default(false).notNull(),
    /**
     * Display conditions — controls which pages this template appears on.
     * Examples:
     *   {}                                       → show on all pages (default)
     *   { show: "all" }                          → show on every page
     *   { show: "all", except: ["page-id-1"] }   → everywhere except specific pages
     *   { show: "only", pages: ["page-id-1"] }   → only on specific pages
     *   { show: "none" }                         → hidden everywhere
     */
    conditions: jsonb("conditions").default("{}").notNull(),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("templates_store_id_idx").on(table.storeId),
    index("templates_store_id_type_idx").on(table.storeId, table.type),
    // Active template lookup (used on every storefront render)
    index("templates_store_id_type_active_idx").on(table.storeId, table.type, table.isActive),
    // isActive filter alone
    index("templates_is_active_idx").on(table.isActive),
    // Soft-delete filter
    index("templates_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Popups ───────────────────────────────────────────────────────────────────
//
// Standalone popup builder. Each popup has:
//   - Puck editor content (jsonb)
//   - Trigger settings: when/how to show (jsonb) — see PopupTrigger in lib/popups/types.ts
//   - Display conditions: which pages to show on (jsonb) — same ConditionRule[] format
//   - isActive: whether the popup is live on the storefront

export const popups = pgTable(
  "popups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    content: jsonb("content").notNull().default("{}"),
    /** PopupTrigger — event, delay, scrollPercent, clickSelector, frequency */
    trigger: jsonb("trigger").notNull().default("{}"),
    /** ConditionRule[] — same format as template display conditions */
    conditions: jsonb("conditions").notNull().default("{}"),
    isActive: boolean("is_active").default(false).notNull(),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("popups_store_id_idx").on(table.storeId),
    index("popups_store_id_active_idx").on(table.storeId, table.isActive),
    // isActive filter alone
    index("popups_is_active_idx").on(table.isActive),
    // Soft-delete filter
    index("popups_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id").notNull(),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    metadata: jsonb("metadata"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_store_id_idx").on(table.storeId),
    index("audit_logs_timestamp_idx").on(table.timestamp),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_resource_id_idx").on(table.resourceId),
    // Composite index for common query pattern (user + timestamp)
    index("audit_logs_user_timestamp_idx").on(table.userId, table.timestamp),
  ]
);

// ─── Warehouses ───────────────────────────────────────────────────────────────

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("warehouses_store_id_idx").on(table.storeId),
    index("warehouses_store_id_active_idx").on(table.storeId, table.isActive),
    index("warehouses_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    address: text("address"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("suppliers_store_id_idx").on(table.storeId),
    index("suppliers_store_id_active_idx").on(table.storeId, table.isActive),
    index("suppliers_deleted_at_idx").on(table.deletedAt),
  ]
);

// ─── Inventory Transfers ──────────────────────────────────────────────────────

export const inventoryTransfers = pgTable(
  "inventory_transfers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceNumber: text("reference_number").notNull(),
    fromWarehouseId: uuid("from_warehouse_id")
      .references(() => warehouses.id, { onDelete: "cascade" })
      .notNull(),
    toWarehouseId: uuid("to_warehouse_id")
      .references(() => warehouses.id, { onDelete: "cascade" })
      .notNull(),
    status: text("status").default("pending").notNull(), // pending | in_transit | completed | cancelled
    notes: text("notes"),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("inventory_transfers_store_id_idx").on(table.storeId),
    index("inventory_transfers_status_idx").on(table.status),
    index("inventory_transfers_from_warehouse_idx").on(table.fromWarehouseId),
    index("inventory_transfers_to_warehouse_idx").on(table.toWarehouseId),
    index("inventory_transfers_created_at_idx").on(table.createdAt),
  ]
);

// ─── Transfer Items ───────────────────────────────────────────────────────────

export const transferItems = pgTable(
  "transfer_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transferId: uuid("transfer_id")
      .references(() => inventoryTransfers.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("transfer_items_transfer_id_idx").on(table.transferId),
    index("transfer_items_product_id_idx").on(table.productId),
  ]
);

// ─── Sales ────────────────────────────────────────────────────────────────────

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceNumber: text("reference_number").notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(), // cents
    totalPrice: integer("total_price").notNull(), // cents
    warehouseId: uuid("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    notes: text("notes"),
    saleDate: timestamp("sale_date").defaultNow().notNull(),
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("sales_store_id_idx").on(table.storeId),
    index("sales_product_id_idx").on(table.productId),
    index("sales_warehouse_id_idx").on(table.warehouseId),
    index("sales_supplier_id_idx").on(table.supplierId),
    index("sales_sale_date_idx").on(table.saleDate),
    index("sales_created_at_idx").on(table.createdAt),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  user: one(users, { fields: [stores.userId], references: [users.id] }),
  products: many(products),
  collections: many(collections),
  categories: many(categories),
  brands: many(brands),
  tags: many(tags),
  pages: many(pages),
  templates: many(templates),
  popups: many(popups),
  warehouses: many(warehouses),
  suppliers: many(suppliers),
  inventoryTransfers: many(inventoryTransfers),
  sales: many(sales),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  store: one(stores, { fields: [collections.storeId], references: [stores.id] }),
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, { fields: [categories.storeId], references: [stores.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  store: one(stores, { fields: [brands.storeId], references: [stores.id] }),
  products: many(products),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  store: one(stores, { fields: [tags.storeId], references: [stores.id] }),
  productTags: many(productTags),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  collection: one(collections, { fields: [products.collectionId], references: [collections.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  productTags: many(productTags),
  inventory: one(inventory, { fields: [products.id], references: [inventory.productId] }),
  sales: many(sales),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, { fields: [productTags.productId], references: [products.id] }),
  tag: one(tags, { fields: [productTags.tagId], references: [tags.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
  store: one(stores, { fields: [inventory.storeId], references: [stores.id] }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  store: one(stores, { fields: [pages.storeId], references: [stores.id] }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  store: one(stores, { fields: [templates.storeId], references: [stores.id] }),
}));

export const popupsRelations = relations(popups, ({ one }) => ({
  store: one(stores, { fields: [popups.storeId], references: [stores.id] }),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  store: one(stores, { fields: [warehouses.storeId], references: [stores.id] }),
  outgoingTransfers: many(inventoryTransfers),
  sales: many(sales),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  store: one(stores, { fields: [suppliers.storeId], references: [stores.id] }),
  sales: many(sales),
}));

export const inventoryTransfersRelations = relations(inventoryTransfers, ({ one, many }) => ({
  store: one(stores, { fields: [inventoryTransfers.storeId], references: [stores.id] }),
  fromWarehouse: one(warehouses, { fields: [inventoryTransfers.fromWarehouseId], references: [warehouses.id] }),
  toWarehouse: one(warehouses, { fields: [inventoryTransfers.toWarehouseId], references: [warehouses.id] }),
  createdByUser: one(users, { fields: [inventoryTransfers.createdBy], references: [users.id] }),
  items: many(transferItems),
}));

export const transferItemsRelations = relations(transferItems, ({ one }) => ({
  transfer: one(inventoryTransfers, { fields: [transferItems.transferId], references: [inventoryTransfers.id] }),
  product: one(products, { fields: [transferItems.productId], references: [products.id] }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  store: one(stores, { fields: [sales.storeId], references: [stores.id] }),
  product: one(products, { fields: [sales.productId], references: [products.id] }),
  warehouse: one(warehouses, { fields: [sales.warehouseId], references: [warehouses.id] }),
  supplier: one(suppliers, { fields: [sales.supplierId], references: [suppliers.id] }),
  createdByUser: one(users, { fields: [sales.createdBy], references: [users.id] }),
}));
