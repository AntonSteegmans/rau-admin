-- ─────────────────────────────────────────────────────────────
-- RAÚ ADMIN — Supabase Schema
-- Voer dit uit in de Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Kolommen toevoegen aan bestaande clients tabel
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0;

-- 2. Profiles (koppelt auth-gebruikers aan rollen)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL
);

-- 3. Services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  type text,
  description text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  date date,
  technician text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  estimated_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Facturen
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  amount numeric DEFAULT 0,
  type text,
  description text,
  period text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue')),
  date date,
  created_at timestamptz DEFAULT now()
);

-- 5. Berichten
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  subject text,
  body text,
  direction text DEFAULT 'outgoing' CHECK (direction IN ('incoming', 'outgoing')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Team
CREATE TABLE IF NOT EXISTS team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  role text,
  speciality text,
  avatar text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  active_tasks integer DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────

-- Hulpfuncties
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION my_client_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER
AS $$ SELECT client_id FROM profiles WHERE id = auth.uid() $$;

-- RLS activeren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Brands & Models (admin schrijven, ingelogde gebruikers lezen)
DROP POLICY IF EXISTS "brands_admin" ON brands;
DROP POLICY IF EXISTS "brands_read" ON brands;
CREATE POLICY "brands_admin" ON brands FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "brands_read" ON brands FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "models_admin" ON models;
DROP POLICY IF EXISTS "models_read" ON models;
CREATE POLICY "models_admin" ON models FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "models_read" ON models FOR SELECT USING (auth.uid() IS NOT NULL);

-- Clients
DROP POLICY IF EXISTS "clients_admin" ON clients;
DROP POLICY IF EXISTS "clients_own" ON clients;
CREATE POLICY "clients_admin" ON clients FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "clients_own" ON clients FOR SELECT USING (id = my_client_id());

-- Vehicles
DROP POLICY IF EXISTS "vehicles_admin" ON vehicles;
DROP POLICY IF EXISTS "vehicles_own" ON vehicles;
CREATE POLICY "vehicles_admin" ON vehicles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "vehicles_own" ON vehicles FOR SELECT USING (client_id = my_client_id());

-- Services
DROP POLICY IF EXISTS "services_admin" ON services;
DROP POLICY IF EXISTS "services_own" ON services;
CREATE POLICY "services_admin" ON services FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "services_own" ON services FOR SELECT USING (client_id = my_client_id());

-- Invoices
DROP POLICY IF EXISTS "invoices_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_own" ON invoices;
CREATE POLICY "invoices_admin" ON invoices FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "invoices_own" ON invoices FOR SELECT USING (client_id = my_client_id());

-- Messages
DROP POLICY IF EXISTS "messages_admin" ON messages;
DROP POLICY IF EXISTS "messages_own_read" ON messages;
DROP POLICY IF EXISTS "messages_client_insert" ON messages;
CREATE POLICY "messages_admin" ON messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "messages_own_read" ON messages FOR SELECT USING (client_id = my_client_id());
CREATE POLICY "messages_client_insert" ON messages FOR INSERT
  WITH CHECK (direction = 'incoming' AND client_id = my_client_id());

-- Team (alleen admin)
DROP POLICY IF EXISTS "team_admin" ON team;
CREATE POLICY "team_admin" ON team FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────
-- Storage: 3d-models bucket leesbaar voor ingelogde gebruikers
-- Voer dit uit in Storage → Policies
-- ─────────────────────────────────────────────────────────────
-- CREATE POLICY "authenticated read 3d-models"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = '3d-models' AND auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- Stap 2: Gebruikers aanmaken
-- Maak accounts aan via Supabase Dashboard → Authentication → Users → "Add user"
--   admin@rau.be  /  (jouw wachtwoord)
--   klant@rau.be  /  klant
--
-- Voer daarna dit uit (vervang de UUIDs):
-- ─────────────────────────────────────────────────────────────

-- Admin profiel:
-- INSERT INTO profiles (id, role) VALUES ('VERVANG-MET-ADMIN-USER-UUID', 'admin');

-- Klant profiel (koppelt aan eerste client in de database):
-- INSERT INTO profiles (id, role, client_id)
-- SELECT u.id, 'client', c.id
-- FROM auth.users u
-- CROSS JOIN (SELECT id FROM clients ORDER BY created_at LIMIT 1) c
-- WHERE u.email = 'klant@rau.be';
