-- ARQA Phase 1: procurement cost-chain foundation (PostgreSQL)
-- Price rows are immutable in normal operation: close a validity period, then add a new row.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE arqa_unit AS ENUM ('ton', 'm3', 'piece', 'trip');
CREATE TYPE arqa_price_basis AS ENUM ('per_unit', 'per_trip');
CREATE TYPE arqa_quote_status AS ENUM ('draft', 'calculated', 'approved', 'expired', 'rejected');
CREATE TYPE arqa_cost_kind AS ENUM (
  'purchase', 'loading', 'transport', 'waiting', 'fees', 'gratuities',
  'other', 'waste', 'administration', 'profit'
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  base_unit arqa_unit NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  tax_no text UNIQUE,
  quality_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  on_time_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (on_time_rate BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  credit_limit numeric(16,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_zones (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quarries (
  id uuid PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  name text NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  daily_capacity numeric(14,3) CHECK (daily_capacity >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_sources (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id),
  quarry_id uuid NOT NULL REFERENCES quarries(id),
  minimum_quantity numeric(14,3) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
  available_quantity numeric(14,3) CHECK (available_quantity >= 0),
  loading_minutes integer CHECK (loading_minutes >= 0),
  UNIQUE (product_id, quarry_id)
);

CREATE TABLE supplier_prices (
  id uuid PRIMARY KEY,
  product_source_id uuid NOT NULL REFERENCES product_sources(id),
  amount numeric(16,4) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL,
  unit arqa_unit NOT NULL,
  valid_from date NOT NULL,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to >= valid_from),
  EXCLUDE USING gist (
    product_source_id WITH =,
    currency WITH =,
    unit WITH =,
    daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&
  )
);

CREATE TABLE transport_modes (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  capacity numeric(14,3) NOT NULL CHECK (capacity > 0),
  capacity_unit arqa_unit NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE transport_prices (
  id uuid PRIMARY KEY,
  quarry_id uuid NOT NULL REFERENCES quarries(id),
  delivery_zone_id uuid NOT NULL REFERENCES delivery_zones(id),
  transport_mode_id uuid NOT NULL REFERENCES transport_modes(id),
  amount numeric(16,4) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL,
  basis arqa_price_basis NOT NULL,
  valid_from date NOT NULL,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to >= valid_from),
  EXCLUDE USING gist (
    quarry_id WITH =,
    delivery_zone_id WITH =,
    transport_mode_id WITH =,
    currency WITH =,
    daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&
  )
);

CREATE TABLE projects (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id),
  delivery_zone_id uuid NOT NULL REFERENCES delivery_zones(id),
  name text NOT NULL,
  start_date date,
  end_date date,
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE quote_requests (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit arqa_unit NOT NULL,
  requested_date date NOT NULL,
  admin_rate numeric(7,6) NOT NULL DEFAULT 0 CHECK (admin_rate >= 0),
  profit_markup_rate numeric(7,6) NOT NULL DEFAULT 0 CHECK (profit_markup_rate >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quotes (
  id uuid PRIMARY KEY,
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id),
  status arqa_quote_status NOT NULL DEFAULT 'draft',
  currency char(3) NOT NULL,
  landed_unit_cost numeric(16,4),
  recommended_unit_price numeric(16,4),
  total_cost numeric(16,4),
  total_price numeric(16,4),
  calculated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quote_cost_lines (
  id uuid PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  kind arqa_cost_kind NOT NULL,
  label text NOT NULL,
  source_record_id uuid,
  unit_amount numeric(16,4) NOT NULL CHECK (unit_amount >= 0),
  total_amount numeric(16,4) NOT NULL CHECK (total_amount >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX supplier_prices_lookup
  ON supplier_prices (product_source_id, valid_from DESC);
CREATE INDEX transport_prices_lookup
  ON transport_prices (quarry_id, delivery_zone_id, transport_mode_id, valid_from DESC);
CREATE INDEX quote_cost_lines_quote_id ON quote_cost_lines (quote_id);
