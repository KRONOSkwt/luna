#!/usr/bin/env node
// Verify-RLS: proves the memories security model against a running LOCAL Supabase stack.
//
// Usage:
//   supabase start       (or: supabase db reset  to re-apply migrations + seed)
//   node scripts/verify-rls.mjs
//
// The script refuses to run against a non-local Supabase instance, so it can
// never validate (or corrupt) a real project's security posture by accident.
//
// Checks (per design: capabilities memories-schema-rls + deploy-ci; evidence memos):
//   a. anonymous SELECT returns the 5 seeded memories       (public read by design)
//   b. anonymous INSERT is rejected with 42501              (write requires admin)
//   c. anonymous UPDATE/DELETE silently affect 0 rows       (RLS using() → false)
//   d. authenticated NON-admin can SELECT but INSERT fails  (42501, is_admin() = false)
//   e. authenticated ADMIN (email on admins allowlist) can SELECT/INSERT/UPDATE/DELETE
//   f. anonymous cannot READ the admins allowlist           (deny-all, no grants)

import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const PASS = new Set();
const FAIL = new Set();

function report(name, ok, detail = '') {
  if (ok) PASS.add(name);
  else FAIL.add(name);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function localEnv() {
  const res = spawnSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(
      '`supabase status -o env` failed — start the local stack first (supabase start)',
    );
  }
  const env = {};
  for (const line of res.stdout.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(\S+)$/);
    if (m) env[m[1]] = m[2];
  }
  return {
    url: env.SUPABASE_URL,
    anon: env.SUPABASE_ANON_KEY,
    service: env.SUPABASE_SERVICE_ROLE_KEY ?? env.SERVICE_ROLE_KEY,
  };
}

async function main() {
  // --- local-only guard -----------------------------------------------------
  const { url, anon, service } = localEnv();
  if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
    console.error(`verify-rls refuses to run against non-local Supabase: ${url}`);
    process.exit(1);
  }
  if (!anon || !service) {
    console.error('verify-rls: missing ANON/SERVICE keys from `supabase status -o env`');
    process.exit(1);
  }

  const anonClient = createClient(url, anon, { auth: { persistSession: false } });
  const serviceClient = createClient(url, service);

  const email = () => `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const pass = 'verify-pass-12345';

  // --- a. anonymous public read (seed applied) ------------------------------
  const { data: anonRows, error: anonReadErr } = await anonClient
    .from('memories')
    .select('*')
    .order('date', { ascending: true });
  report(
    'a. anon SELECT memories',
    !anonReadErr && Array.isArray(anonRows) && anonRows.length === 5,
    anonReadErr ? anonReadErr.message : `${anonRows?.length ?? 0} rows (expected 5 from seed)`,
  );
  if (anonReadErr || anonRows?.length !== 5) return;

  // --- b. anonymous INSERT rejected (42501) ----------------------------------
  const { error: anonInsertErr } = await anonClient.from('memories').insert({
    date: '2026-01-01',
    title: 'attacker row',
    description: 'must not persist',
  });
  report(
    'b. anon INSERT rejected (42501)',
    Boolean(anonInsertErr && anonInsertErr.code === '42501'),
    anonInsertErr ? `code ${anonInsertErr.code}` : 'no error — INSERT was allowed',
  );

  // --- c. anonymous UPDATE/DELETE affect 0 rows ------------------------------
  const targetId = anonRows[0].id;
  const upd = await anonClient
    .from('memories')
    .update({ title: 'attacker title' })
    .eq('id', targetId);
  const del = await anonClient.from('memories').delete().eq('id', targetId);
  const after = await anonClient.from('memories').select('title,date').eq('id', targetId).single();
  const rowIntact =
    !upd.error && !del.error && !after.error && after.data?.title !== 'attacker title';
  report(
    'c. anon UPDATE/DELETE no-op (row intact)',
    rowIntact,
    after.error ? after.error.message : '0 rows changed, memory untouched',
  );

  // --- d. authenticated non-admin: read ok, write 42501 ----------------------
  const guestEmail = email();
  const { error: guestSignUpErr } = await anonClient.auth.signUp({
    email: guestEmail,
    password: pass,
  });
  const guestHostError =
    guestSignUpErr?.message && /confirm|verification|otp/i.test(guestSignUpErr.message);
  if (guestSignUpErr && guestHostError) {
    console.log('SKIP  d. non-admin write — local host requires email confirmation');
  } else {
    const { data: guestSession, error: guestSignInErr } = await anonClient.auth.signInWithPassword({
      email: guestEmail,
      password: pass,
    });
    const guest = createClient(url, anon, { auth: { persistSession: false } });
    await guest.auth.setSession(guestSession.session);
    const { error: guestReadErr } = await guest.from('memories').select('id').limit(1);
    const { error: guestWriteErr } = await guest.from('memories').insert({
      date: '2026-01-02',
      title: 'guest row',
      description: 'must not persist',
    });
    report(
      'd. non-admin authenticated: SELECT ok / INSERT 42501',
      Boolean(!guestSignInErr && !guestReadErr && guestWriteErr?.code === '42501'),
      !guestSignInErr && !guestReadErr
        ? `code ${guestWriteErr?.code ?? '(none)'}`
        : [guestSignInErr?.message, guestReadErr?.message, guestWriteErr?.message]
            .filter(Boolean)
            .join('; '),
    );
  }

  // --- e. admin (allowlist): full CRUD ---------------------------------------
  const adminEmail = email();
  const { error: adminSignUpErr } = await anonClient.auth.signUp({
    email: adminEmail,
    password: pass,
  });
  if (adminSignUpErr && /confirm|verification|otp/i.test(adminSignUpErr.message)) {
    console.log('SKIP  e. admin CRUD — local host requires email confirmation');
  } else {
    const { error: allowlistErr } = await serviceClient
      .from('admins')
      .insert({ email: adminEmail.toLowerCase() });
    const { data: adminSession, error: adminSignInErr } = await anonClient.auth.signInWithPassword({
      email: adminEmail,
      password: pass,
    });
    const admin = createClient(url, anon, { auth: { persistSession: false } });
    await admin.auth.setSession(adminSession.session);

    const { data: adminRows, error: adminReadErr } = await admin.from('memories').select('*');
    const { error: adminInsertErr } = await admin.from('memories').insert({
      date: '2026-01-03',
      title: 'verify admin row',
      description: 'temporary row deleted at the end of this run',
    });
    let adminUpdateErr = null;
    let adminDeleteErr = null;
    let insertedId = null;
    if (!adminInsertErr) {
      const { data: inserted } = await admin
        .from('memories')
        .select('id')
        .eq('date', '2026-01-03')
        .single();
      insertedId = inserted?.id ?? null;
      const upd = await admin
        .from('memories')
        .update({ title: 'verify admin row (edited)' })
        .eq('id', insertedId);
      adminUpdateErr = upd.error;
      const del = await admin.from('memories').delete().eq('id', insertedId);
      adminDeleteErr = del.error;
    }
    report(
      'e. admin allowlist CRUD',
      Boolean(
        !allowlistErr &&
        !adminSignInErr &&
        !adminReadErr &&
        !adminInsertErr &&
        !adminUpdateErr &&
        !adminDeleteErr &&
        adminRows?.length >= 5,
      ),
      [
        allowlistErr?.message,
        adminSignInErr?.message,
        adminReadErr?.message,
        adminInsertErr?.message,
        adminUpdateErr?.message,
        adminDeleteErr?.message,
      ]
        .filter(Boolean)
        .join('; ') || `${adminRows?.length ?? 0} rows read, insert→update→delete roundtrip ok`,
    );
  }

  // --- f. admins allowlist is not readable by anon (deny-all) ----------------
  const { data: adminsSeen, error: adminsErr } = await anonClient.from('admins').select('email');
  report(
    'f. anon cannot read admins allowlist',
    Boolean(adminsErr) || (Array.isArray(adminsSeen) && adminsSeen.length === 0),
    adminsErr ? adminsErr.message : `${adminsSeen?.length ?? 0} rows exposed`,
  );

  // --- verdict ----------------------------------------------------------------
  console.log(`\nverify-rls: ${PASS.size} passed, ${FAIL.size} failed`);
  if (FAIL.size > 0) {
    for (const name of FAIL) console.log(`  FAILED: ${name}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`verify-rls crashed: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
