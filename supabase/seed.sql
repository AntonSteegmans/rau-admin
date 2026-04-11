-- ─────────────────────────────────────────────────────────────
-- RAÚ ADMIN — Demo data
-- Voer dit uit NA schema.sql en nadat clients/vehicles geseed zijn
-- via de "DEMO IMPORTEREN" knop in de admin Fleet sectie
-- ─────────────────────────────────────────────────────────────

-- Avatar en total_spent voor demo klanten
UPDATE clients SET avatar = 'AV', total_spent = 84200  WHERE name = 'Alexander Van den Berg';
UPDATE clients SET avatar = 'MD', total_spent = 32400  WHERE name = 'Marie-Claire Dubois';
UPDATE clients SET avatar = 'TD', total_spent = 126800 WHERE name = 'Thomas De Smedt';
UPDATE clients SET avatar = 'SJ', total_spent = 8400   WHERE name = 'Sophie Janssen';
UPDATE clients SET avatar = 'BP', total_spent = 41200  WHERE name = 'Bart Peeters';

-- Team
INSERT INTO team (name, role, speciality, avatar, status, active_tasks) VALUES
  ('Kevin Martens',    'Lead Technician',    'Engine & Drivetrain',           'KM', 'busy',      2),
  ('Yannick De Wolf',  'Detailing Specialist','Paint Correction & Ceramic',   'YD', 'busy',      1),
  ('Jonas Vermeersch', 'Technician',          'Diagnostics & Electronics',    'JV', 'available', 0),
  ('Lisa Claes',       'Client Relations',    'Scheduling & Communications',  'LC', 'busy',      3);

-- Services, facturen en berichten via dynamische UUIDs
DO $$
DECLARE
  v_cl001 uuid; v_cl002 uuid; v_cl003 uuid; v_cl004 uuid;
  v_v002 uuid; v_v003 uuid; v_v004 uuid; v_v005 uuid; v_v007 uuid;
BEGIN
  SELECT id INTO v_cl001 FROM clients WHERE name = 'Alexander Van den Berg' LIMIT 1;
  SELECT id INTO v_cl002 FROM clients WHERE name = 'Marie-Claire Dubois'    LIMIT 1;
  SELECT id INTO v_cl003 FROM clients WHERE name = 'Thomas De Smedt'        LIMIT 1;
  SELECT id INTO v_cl004 FROM clients WHERE name = 'Sophie Janssen'         LIMIT 1;

  SELECT id INTO v_v002 FROM vehicles WHERE plate = '1-DEF-456' LIMIT 1;
  SELECT id INTO v_v003 FROM vehicles WHERE plate = '1-GHI-789' LIMIT 1;
  SELECT id INTO v_v004 FROM vehicles WHERE plate = '1-JKL-012' LIMIT 1;
  SELECT id INTO v_v005 FROM vehicles WHERE plate = '1-MNO-345' LIMIT 1;
  SELECT id INTO v_v007 FROM vehicles WHERE plate = '1-STU-901' LIMIT 1;

  -- ─ Services ─
  IF v_cl001 IS NOT NULL AND v_v002 IS NOT NULL THEN
    INSERT INTO services (vehicle_id, client_id, type, description, status, date, technician, priority, estimated_cost)
    VALUES (v_v002, v_cl001, 'Full Service', 'Annual inspection, oil & filter change, brake check', 'in-progress', '2026-03-24', 'Kevin Martens', 'normal', 2200);
  END IF;

  IF v_cl003 IS NOT NULL AND v_v005 IS NOT NULL THEN
    INSERT INTO services (vehicle_id, client_id, type, description, status, date, technician, priority, estimated_cost)
    VALUES (v_v005, v_cl003, 'Pickup & Detailing', 'Pickup from client, full detailing, ceramic touch-up', 'scheduled', '2026-03-28', 'Yannick De Wolf', 'normal', 890);
  END IF;

  IF v_cl004 IS NOT NULL AND v_v007 IS NOT NULL THEN
    INSERT INTO services (vehicle_id, client_id, type, description, status, date, technician, priority, estimated_cost)
    VALUES (v_v007, v_cl004, 'Tire Change', 'Switch to summer tires — Michelin Cup 2 set', 'in-progress', '2026-03-25', 'Kevin Martens', 'high', 3200);
  END IF;

  IF v_cl002 IS NOT NULL AND v_v003 IS NOT NULL THEN
    INSERT INTO services (vehicle_id, client_id, type, description, status, date, technician, priority, estimated_cost)
    VALUES (v_v003, v_cl002, 'Storage Prep', 'Battery tender, tire pressure, cover installation', 'completed', '2026-03-20', 'Yannick De Wolf', 'low', 350);
  END IF;

  IF v_cl003 IS NOT NULL AND v_v004 IS NOT NULL THEN
    INSERT INTO services (vehicle_id, client_id, type, description, status, date, technician, priority, estimated_cost)
    VALUES (v_v004, v_cl003, 'Annual Inspection', 'Full Bugatti certified inspection — 2-day process', 'scheduled', '2026-06-01', 'Kevin Martens', 'high', 8500);
  END IF;

  -- ─ Facturen ─
  IF v_cl001 IS NOT NULL THEN
    INSERT INTO invoices (client_id, amount, type, description, period, status, date) VALUES
      (v_cl001, 2500, 'Abonnement', NULL,                      'Maart 2026', 'paid',    '2026-03-01'),
      (v_cl001, 3890, 'Service',    'GT3 RS — Tire replacement', NULL,        'pending', '2026-03-24');
  END IF;
  IF v_cl002 IS NOT NULL THEN
    INSERT INTO invoices (client_id, amount, type, description, period, status, date) VALUES
      (v_cl002, 1500, 'Abonnement', NULL, 'Maart 2026', 'paid', '2026-03-01');
  END IF;
  IF v_cl003 IS NOT NULL THEN
    INSERT INTO invoices (client_id, amount, type, description, period, status, date) VALUES
      (v_cl003, 3500, 'Abonnement', NULL,                             'Maart 2026', 'paid',  '2026-03-01'),
      (v_cl003,  890, 'Service',    '812 Competizione — Detailing',    NULL,        'draft', '2026-03-28');
  END IF;
  IF v_cl004 IS NOT NULL THEN
    INSERT INTO invoices (client_id, amount, type, description, period, status, date) VALUES
      (v_cl004,  800, 'Abonnement', NULL,                     'Maart 2026', 'overdue', '2026-03-01'),
      (v_cl004, 3200, 'Service',    'Cayman GT4 — Tire change', NULL,       'draft',   '2026-03-25');
  END IF;

  -- ─ Berichten ─
  IF v_cl001 IS NOT NULL THEN
    INSERT INTO messages (client_id, subject, body, direction, read, created_at) VALUES
      (v_cl001, 'GT3 RS Service Update',   'Uw Porsche is binnen voor de jaarlijkse inspectie. Verwachte oplevering: vrijdag.', 'outgoing', true,  NOW() - INTERVAL '2 hours'),
      (v_cl001, 'Waarde-update collectie', 'Uw maandelijkse waarde-rapport is beschikbaar in uw portaal.',                      'outgoing', true,  NOW() - INTERVAL '3 days');
  END IF;
  IF v_cl003 IS NOT NULL THEN
    INSERT INTO messages (client_id, subject, body, direction, read, created_at) VALUES
      (v_cl003, '812 Competizione Ophaling', 'Graag bevestiging van het ophaaladres voor zaterdag 28/03.', 'outgoing', false, NOW() - INTERVAL '5 hours');
  END IF;
  IF v_cl004 IS NOT NULL THEN
    INSERT INTO messages (client_id, subject, body, direction, read, created_at) VALUES
      (v_cl004, 'Vraag over banden', 'Zijn de Michelin Cup 2 beter dan de Pirelli Trofeo? Graag uw advies.', 'incoming', true, NOW() - INTERVAL '1 day');
  END IF;
  IF v_cl002 IS NOT NULL THEN
    INSERT INTO messages (client_id, subject, body, direction, read, created_at) VALUES
      (v_cl002, 'Factuur februari', 'Bedankt voor de snelle service. Factuur is betaald.', 'incoming', true, NOW() - INTERVAL '2 days');
  END IF;
END $$;
