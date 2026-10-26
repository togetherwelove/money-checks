// Run with PGLITE_MODULE_PATH pointing to an installed @electric-sql/pglite package.
const { PGlite } = require(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('only the current owner can rename through public or private RPCs', async () => {
  const db = new PGlite();
  const owner = '00000000-0000-0000-0000-000000000001';
  const editor = '00000000-0000-0000-0000-000000000002';
  const viewer = '00000000-0000-0000-0000-000000000003';
  const outsider = '00000000-0000-0000-0000-000000000004';
  const book = '00000000-0000-0000-0000-000000000010';
  const migration = name => fs.readFileSync(path.join(__dirname, '../supabase/migrations', name), 'utf8');
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema private;
      create function auth.uid() returns uuid language sql as $$
        select nullif(current_setting('test.user_id', true), '')::uuid
      $$;
      create table public.ledger_books (id uuid primary key, owner_id uuid not null, name text not null);
      create table public.profiles (id uuid primary key, active_book_id uuid);
      create table public.ledger_book_members (book_id uuid, user_id uuid, role text);
      insert into public.ledger_books values ('${book}', '${owner}', 'original');
      insert into public.profiles values
        ('${owner}', '${book}'), ('${editor}', '${book}'), ('${viewer}', '${book}'), ('${outsider}', '${book}');
      insert into public.ledger_book_members values
        ('${book}', '${owner}', 'owner'), ('${book}', '${editor}', 'editor'), ('${book}', '${viewer}', 'viewer');
      grant usage on schema private, auth to authenticated;
    `);
    await db.exec(migration('202610240001_restrict_ledger_book_rename_to_owner.sql'));
    const wrappers = migration('202605020006_move_authenticated_definer_rpcs_to_private_schema.sql');
    const start = wrappers.indexOf('create or replace function public.update_active_ledger_book_name(');
    await db.exec(wrappers.slice(start, wrappers.indexOf('$$;', start) + 3));
    await db.exec('revoke execute on function public.update_active_ledger_book_name(text) from public, anon; grant execute on function public.update_active_ledger_book_name(text) to authenticated; set role authenticated;');
    const asUser = id => db.query("select set_config('test.user_id', $1, false)", [id]);
    const rename = (schema, name) => db.query(`select * from ${schema}.update_active_ledger_book_name($1)`, [name]);
    await asUser(owner);
    assert.equal((await rename('public', '  새   이름  ')).rows[0].name, '새 이름');
    await assert.rejects(rename('public', '  '), /name is required/);
    for (const user of [editor, viewer, outsider]) {
      await asUser(user);
      for (const schema of ['public', 'private']) {
        await assert.rejects(rename(schema, 'not allowed'), error => error.code === '42501');
      }
    }
    await asUser('');
    await assert.rejects(rename('public', 'not allowed'), /No active ledger book/);
    await db.exec('reset role');
    assert.equal((await db.query('select name from public.ledger_books')).rows[0].name, '새 이름');
    await db.query('update public.ledger_books set owner_id = $1 where id = $2', [editor, book]);
    await db.exec('set role authenticated');
    await asUser(owner);
    await assert.rejects(rename('public', 'old owner'), error => error.code === '42501');
    await asUser(editor);
    assert.equal((await rename('public', 'new owner')).rows[0].name, 'new owner');
  } finally {
    await db.close();
  }
});
