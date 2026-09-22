// Idempotent CREATE TABLE statements — safe to run on every cold start.
// Mirrors src/db/schema.ts exactly. If you ever change schema.ts, update this too
// (or switch to real drizzle migrations later — this is the zero-setup version).
export const bootstrapStatements = [
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    group_slug TEXT NOT NULL DEFAULT 'shoes'
  )`,
  // Covers databases that already had a categories table before group_slug existed.
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_slug TEXT NOT NULL DEFAULT 'shoes'`,
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    description TEXT NOT NULL,
    details JSONB NOT NULL,
    images JSONB NOT NULL,
    sizes JSONB NOT NULL,
    colorway TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL,
    compare_at_cents INTEGER,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 4.8,
    review_count INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 20,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    sold_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL DEFAULT 'One Size',
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    delivery_method TEXT NOT NULL DEFAULT 'courier',
    payment_method TEXT NOT NULL DEFAULT 'eft',
    notes TEXT NOT NULL DEFAULT '',
    subtotal_cents INTEGER NOT NULL,
    shipping_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    installments_paid INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    slug TEXT NOT NULL,
    image_url TEXT NOT NULL,
    size TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS daily_deals (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    percent_off INTEGER NOT NULL DEFAULT 20,
    ends_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    quote TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    image_url TEXT NOT NULL DEFAULT '',
    product_name TEXT NOT NULL DEFAULT '',
    is_live BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // Added after the table above already existed on some deployments — ALTER ... IF NOT
  // EXISTS is idempotent (safe to run every cold start) and self-heals any orders table
  // created before this column existed. No manual migration needed.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT NOT NULL DEFAULT ''`,
  // Same self-healing pattern, for per-size pricing (e.g. wig lengths each having
  // their own rand price under one listing). No manual migration needed here either.
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS size_pricing JSONB`,
  // Storewide "discount of the day" support: product_id becomes optional (null =
  // applies to every product) and a scope column says which mode is active.
  `ALTER TABLE daily_deals ALTER COLUMN product_id DROP NOT NULL`,
  `ALTER TABLE daily_deals ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'product'`,
  // Buy-both combo/bundle discounts.
  `CREATE TABLE IF NOT EXISTS combos (
    id SERIAL PRIMARY KEY,
    product_a_id INTEGER NOT NULL,
    product_b_id INTEGER NOT NULL,
    percent_off INTEGER NOT NULL DEFAULT 15,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // Pool deals: bulk-selected group of products where any N of them together get a
  // fixed total price or a percent off each — see schema.ts for the full rundown.
  `CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percent',
    percent_off INTEGER,
    fixed_price_cents INTEGER,
    pick_count INTEGER NOT NULL DEFAULT 2,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS pool_items (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL
  )`,
];
