-- ===================================================
-- RYER PARKING — Script de migración para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ===================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── CLIENTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT DEFAULT '',
  email      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- ── ENTRADAS DE VEHÍCULOS ───────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number     TEXT,
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  plate             TEXT NOT NULL,
  brand             TEXT DEFAULT '',
  model             TEXT DEFAULT '',
  year              INTEGER,
  vehicle_type      TEXT DEFAULT 'Cars',
  service_type      TEXT DEFAULT 'Diario',
  entry_time        TIMESTAMPTZ DEFAULT NOW(),
  exit_time         TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  status            TEXT DEFAULT 'active',
  total             NUMERIC(10,2) DEFAULT 0
);
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;

-- ── SESIONES DE CAJA ────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  open_time        TIMESTAMPTZ DEFAULT NOW(),
  close_time       TIMESTAMPTZ,
  initial_balance  NUMERIC(10,2) DEFAULT 0,
  final_balance    NUMERIC(10,2),
  expected_balance NUMERIC(10,2),
  difference       NUMERIC(10,2),
  status           TEXT DEFAULT 'open'
);
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- ── TARIFAS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rates (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  price_6to6  NUMERIC(10,2) DEFAULT 0,
  price_12h   NUMERIC(10,2) DEFAULT 0,
  price_24h   NUMERIC(10,2) DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);
ALTER TABLE rates DISABLE ROW LEVEL SECURITY;

-- ── USUARIOS STAFF ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role     TEXT DEFAULT 'Operator'
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ── CONFIGURACIÓN ───────────────────────────────────
CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE config DISABLE ROW LEVEL SECURITY;

-- ── HABILITAR REALTIME ──────────────────────────────
-- Agregar tablas al canal de realtime de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE entries;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
