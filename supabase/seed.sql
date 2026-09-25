-- Seed: the five opening nights of the Observatorio (demo-able day one).
-- Placeholder copy in neutral Spanish — Sebas replaces the texts via the admin UI later.
-- Runs once at first push (supabase db reset or db push + seed).

insert into public.memories (date, title, description, is_first_kiss, location, order_index) values
  ('2026-09-06', 'La primera noche', 'La primera noche que miramos el cielo juntos y el silencio se volvió conversación.', false, 'La Paz, Bolivia', 0),
  ('2026-09-11', 'Bailando bajo las estrellas', 'Una brisa fría, una melodía y el cielo de La Paz como única pista de baile.', false, 'La Paz, Bolivia', 0),
  ('2026-09-14', 'La luna sobre el Illimani', 'La luna se asomó sobre las nieves del Illimani y bajamos la voz para no espantarla.', false, 'La Paz, Bolivia', 0),
  ('2026-09-17', 'Noche de cuentas y risas', 'Contamos constelaciones mal y acertamos todas las historias.', false, 'La Paz, Bolivia', 0),
  ('2026-09-21', 'Nuestra noche', 'La noche en que el cielo se guardó para nosotros. Todo empezó mirando las mismas estrellas.', true, 'La Paz, Bolivia', 0);