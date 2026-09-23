import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  // Which main department (see CATEGORY_GROUPS in lib/category-groups.ts) this
  // category nests under, e.g. "sneakers" -> groupSlug "shoes". A category row is
  // always a subcategory/leaf; the department itself isn't a DB row.
  groupSlug: text("group_slug").notNull().default("shoes"),
  // Comma-separated default sizes for products in this subcategory, e.g. "4,5,6,7,8,9,10,11,12".
  // Null/empty means "use the department's default" (see DEPARTMENT_DEFAULT_SIZES in
  // lib/category-groups.ts) — only set this when a subcategory needs its own sizing,
  // like "Kids Shoes" under Shoes, or "Pants" under Clothing.
  sizePreset: text("size_preset"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  categorySlug: text("category_slug").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").$type<string[]>().notNull(),
  images: jsonb("images").$type<string[]>().notNull(),
  sizes: jsonb("sizes").$type<string[]>().notNull(),
  // Optional per-size pricing, e.g. { "10": 100000, "12": 120000 } (cents).
  // Used for things like wigs where each length/size has its own price under
  // ONE listing with a size dropdown, instead of a flat price for every size.
  // When set, this takes priority over priceCents for whichever size is picked;
  // priceCents is still kept in sync as the lowest size price, so "From RXXX"
  // displays and any code that only knows about a flat price keep working.
  sizePricing: jsonb("size_pricing").$type<Record<string, number>>(),
  colorway: text("colorway").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  compareAtCents: integer("compare_at_cents"),
  costCents: integer("cost_cents").notNull().default(0),
  rating: real("rating").notNull().default(4.8),
  reviewCount: integer("review_count").notNull().default(0),
  stock: integer("stock").notNull().default(20),
  isFeatured: boolean("is_featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  soldCount: integer("sold_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  size: text("size").notNull().default("One Size"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  deliveryMethod: text("delivery_method").notNull().default("courier"),
  paymentMethod: text("payment_method").notNull().default("eft"),
  notes: text("notes").notNull().default(""),
  proofOfPaymentUrl: text("proof_of_payment_url").notNull().default(""),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("pending"),
  installmentsPaid: integer("installments_paid").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  slug: text("slug").notNull(),
  imageUrl: text("image_url").notNull(),
  size: text("size").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyDeals = pgTable("daily_deals", {
  id: serial("id").primaryKey(),
  // Null when scope is "store" — a storewide deal isn't tied to one product.
  productId: integer("product_id"),
  // "product": percentOff applies only to productId. "store": applies to everything in stock.
  scope: text("scope").notNull().default("product"),
  percentOff: integer("percent_off").notNull().default(20),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Buy-both bundle discounts: pick two products, set a percent off. The discount only
// applies when a cart contains at least one of BOTH products — naturally limited to
// whatever stock is uploaded for each, since neither product can be added past its own
// stock (and it disappears from the storefront once either side sells out).
export const combos = pgTable("combos", {
  id: serial("id").primaryKey(),
  productAId: integer("product_a_id").notNull(),
  productBId: integer("product_b_id").notNull(),
  percentOff: integer("percent_off").notNull().default(15),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Pool deals: admin bulk-selects a pool of products (e.g. "all T-shirts", or "Batch 1
// sneakers"). Any pickCount items from the pool get discounted together — as a fixed
// total price (e.g. "2 for R1000") or a percent off each item (e.g. "10% off any 2").
// It doesn't matter which items in the pool the customer picks, or which product they
// are — the pool doesn't care, only the count does. Buying more than pickCount just
// applies the deal again for each extra full group (e.g. 4 items = the deal twice).
export const pools = pgTable("pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // "percent": percentOff applies to every item in a full group.
  // "fixed": fixedPriceCents is the total price for one full group (pickCount items),
  // split proportionally across the group's items by their normal price.
  discountType: text("discount_type").notNull().default("percent"),
  percentOff: integer("percent_off"),
  fixedPriceCents: integer("fixed_price_cents"),
  // How many items from the pool make one discounted group (e.g. 2 for "any 2").
  pickCount: integer("pick_count").notNull().default(2),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const poolItems = pgTable("pool_items", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull(),
  productId: integer("product_id").notNull(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  location: text("location").notNull(),
  quote: text("quote").notNull(),
  rating: integer("rating").notNull().default(5),
  imageUrl: text("image_url").notNull().default(""),
  productName: text("product_name").notNull().default(""),
  isLive: boolean("is_live").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type DailyDeal = typeof dailyDeals.$inferSelect;
export type Combo = typeof combos.$inferSelect;
export type Pool = typeof pools.$inferSelect;
export type PoolItem = typeof poolItems.$inferSelect;
