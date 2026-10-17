// Run with PGLITE_MODULE_PATH pointing to an installed @electric-sql/pglite package.
const { PGlite } = require(process.env.PGLITE_MODULE_PATH || "@electric-sql/pglite");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const book = "00000000-0000-0000-0000-000000000010";
const author = "00000000-0000-0000-0000-000000000020";
const ids = [1, 2, 3].map((n) => `00000000-0000-0000-0000-00000000000${n}`);

test("PostgreSQL conversion is atomic, preserves paid rows and receipts, and rejects stale or unauthorized requests", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema private;
      create function auth.uid() returns uuid language sql as $$ select '${author}'::uuid $$;
      create function private.is_book_editor(uuid) returns boolean language sql as $$ select coalesce(current_setting('test.editor', true), 'true') = 'true' $$;
      create table ledger_entries (
        id uuid primary key, book_id uuid, user_id uuid, occurred_on date, amount numeric,
        currency text default 'KRW', entry_type text default 'expense', content text default 'purchase',
        note text default 'note (1/3)', metadata jsonb default '{}',
        installment_group_id text, installment_months integer default 3, installment_order integer,
        updated_at timestamptz default '2026-10-17T00:00:00Z'
      );
      create table ledger_entry_attachments (
        user_id uuid, ledger_entry_id uuid references ledger_entries(id) on delete cascade,
        installment_group_id text, receipt_file_id uuid, created_at timestamptz default now(),
        check ((ledger_entry_id is null) <> (installment_group_id is null))
      );
      create unique index on ledger_entry_attachments(ledger_entry_id, receipt_file_id) where ledger_entry_id is not null;
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, "../supabase/migrations/202610170001_convert_installment_to_one_time.sql"), "utf8"));
    const seed = async () => {
      await db.exec("truncate ledger_entries cascade; set test.editor = 'true';");
      for (let i = 0; i < ids.length; i++) await db.query(
        "insert into ledger_entries(id, book_id, user_id, occurred_on, amount, installment_group_id, installment_order) values ($1,$2,$3,$4,100000,'group',$5)",
        [ids[i], book, author, `2026-${String(8 + i).padStart(2, "0")}-01`, i + 1]);
      await db.query("insert into ledger_entry_attachments(user_id, installment_group_id, receipt_file_id) values ($1,'group',$2)", [author, book]);
      await db.query("insert into ledger_entry_attachments(user_id, ledger_entry_id, receipt_file_id) values ($1,$2,$3)", [author, ids[2], author]);
      return (await db.query("select id, updated_at from ledger_entries order by id")).rows;
    };
    const convert = (snapshot, paid = []) => db.query(
      "select convert_installment_to_one_time($1,'group',$2::uuid[],'2026-10-20',$3::jsonb)", [book, paid, JSON.stringify(snapshot)]);
    let snapshot = await seed();
    await convert(snapshot);
    let rows = (await db.query("select * from ledger_entries")).rows;
    assert.equal(rows.length, 1);
    assert.equal(Number(rows[0].amount), 300000);
    assert.equal(rows[0].installment_group_id, null);
    assert.equal(rows[0].user_id, author);
    assert.equal((await db.query("select * from ledger_entry_attachments")).rows.length, 2);

    snapshot = await seed();
    const paidBefore = (await db.query("select * from ledger_entries where id=$1", [ids[0]])).rows[0];
    await convert(snapshot, [ids[0]]);
    const paidAfter = (await db.query("select * from ledger_entries where id=$1", [ids[0]])).rows[0];
    assert.deepEqual(paidAfter, paidBefore);
    rows = (await db.query("select * from ledger_entries where id <> $1", [ids[0]])).rows;
    assert.equal(rows.length, 1);
    assert.equal(Number(rows[0].amount), 200000);
    assert.equal(rows[0].metadata.installment_status, "PREPAID");
    assert.equal((await db.query("select * from ledger_entry_attachments")).rows.length, 3);

    snapshot = await seed();
    await db.query("update ledger_entries set updated_at='2026-10-18T00:00:00Z' where id=$1", [ids[1]]);
    await assert.rejects(convert(snapshot), /changed/);
    assert.equal((await db.query("select * from ledger_entries")).rows.length, 3);
    snapshot = await seed();
    await assert.rejects(convert(snapshot, ids), /No unpaid/);
    await assert.rejects(convert(snapshot, [book]), /outside/);
    await assert.rejects(convert([snapshot[0], snapshot[0], snapshot[0]]), /changed/);
    await db.exec("set test.editor = 'false'");
    await assert.rejects(convert(snapshot), /Only ledger editors/);
    assert.equal((await db.query("select * from ledger_entries")).rows.length, 3);

    snapshot = await seed();
    await db.exec(`create function reject_conversion() returns trigger language plpgsql as $$ begin raise exception 'forced failure'; end $$;
      create trigger reject_conversion before update on ledger_entries for each row execute function reject_conversion();`);
    await assert.rejects(convert(snapshot), /forced failure/);
    assert.equal((await db.query("select * from ledger_entries")).rows.length, 3);
    assert.equal((await db.query("select * from ledger_entry_attachments")).rows.length, 2);
  } finally {
    await db.close();
  }
});
