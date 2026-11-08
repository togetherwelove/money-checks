const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const { modules } = require("./annualReportHelpers.cjs");

test("PostgreSQL atomically applies, edits, removes and protects linked asset movements", async () => {
  const db = new PGlite();
  const owner = "00000000-0000-0000-0000-000000000001";
  const other = "00000000-0000-0000-0000-000000000002";
  const book = "10000000-0000-0000-0000-000000000001";
  const payment = "20000000-0000-0000-0000-000000000001";
  try {
    await db.exec(`
      create schema auth; create schema private;
      create role anon; create role authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table public.ledger_books(id uuid primary key,owner_id uuid references auth.users(id));
      create table public.ledger_book_members(book_id uuid,user_id uuid,role text);
      create table public.ledger_entries(id uuid primary key,book_id uuid references ledger_books(id) on delete cascade,
        user_id uuid,amount numeric(12,2),occurred_on date,entry_type text,currency text,category_id text,
        installment_group_id text,metadata jsonb default '{}'::jsonb,note text);
      create table public.ledger_book_category_customizations(book_id uuid,entry_type text,category_id text,
        label text,icon_name text,is_system boolean,is_hidden boolean,sort_order integer,updated_at timestamptz,unique(book_id,entry_type,category_id));
      create table public.receipt_files(id uuid primary key,storage_bucket text,storage_path text);
      create table public.ledger_entry_attachments(id uuid primary key default gen_random_uuid(),
        ledger_entry_id uuid references ledger_entries(id) on delete cascade,
        receipt_file_id uuid references receipt_files(id) on delete cascade);
      insert into auth.users values ('${owner}'),('${other}');
      insert into ledger_books values ('${book}','${owner}');
      insert into ledger_book_members values ('${book}','${owner}','owner');
      select set_config('request.jwt.claim.sub','${owner}',false);
    `);
    await db.exec(
      `create function public.ensure_personal_ledger_book(p_user uuid,p_name text) returns uuid language sql as $$ select id from public.ledger_books where owner_id=p_user limit 1 $$;`,
    );
    for (const file of fs
      .readdirSync(path.join(__dirname, "../supabase/migrations"))
      .filter((name) => /^20261101000[1-6]_|^20261107000[1-3]_/.test(name))
      .sort()) {
      await db.exec(fs.readFileSync(path.join(__dirname, "../supabase/migrations", file), "utf8"));
    }
    await db.exec(`create function private.is_book_editor(p_book uuid) returns boolean
      language sql as $$ select exists(select 1 from public.ledger_book_members
        where book_id=p_book and user_id=auth.uid() and role in ('owner','editor')) $$;`);
    async function asset(kind, amount) {
      const result = await db.query(
        `select public.save_personal_asset(null,$1,$2,'','2020-01-01',$3,$4,false) as id`,
        [kind, kind, JSON.stringify({ amount: String(amount) }), book],
      );
      return result.rows[0].id;
    }
    const investment = await asset("stock", 12500000);
    assert.equal(
      Number(
        (
          await db.query("select amount from personal_asset_valuations where asset_id=$1", [
            investment,
          ])
        ).rows[0].amount,
      ),
      12500000,
    );
    const cash = await asset("cash", 1000),
      loan = await asset("loan", 5000);
    const replaceCategories = (categories) => db.query(
      "select private.replace_ledger_book_custom_categories($1,'expense',$2)",
      [book, JSON.stringify(categories)],
    );
    const repaymentCategory = { id: "custom-category-loan-repayment", label: "Repayment", icon_name: "circle" };
    await replaceCategories([repaymentCategory]);
    assert.equal((await db.query("select label from ledger_book_category_customizations")).rows[0].label, "Repayment");
    await assert.rejects(replaceCategories([]), /Loan repayment category is required/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    assert.equal((await db.query("select public.has_ledger_book_loans($1) as value", [book])).rows[0].value, false);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.query("update personal_assets set deleted_on='2020-01-01' where id=$1", [loan]);
    await replaceCategories([]);
    assert.equal((await db.query("select count(*)::int as n from ledger_book_category_customizations")).rows[0].n, 0);
    await db.query("update personal_assets set deleted_on=null where id=$1", [loan]);
    await db.query("select public.ensure_loan_repayment_category($1)", [book]);
    const balance = async (id, date = "2020-02-01") =>
      Number(
        (await db.query("select private.personal_asset_balance($1,$2) as balance", [id, date]))
          .rows[0].balance,
      );
    const link = {
      requestId: payment,
      cashAssetId: cash,
      loanAssetId: loan,
      principal: "80",
      fee: "0",
    };
    async function insert(id, amount, details = link, type = "expense", date = "2020-01-02") {
      await db.query(
        `insert into ledger_entries(id,book_id,user_id,amount,occurred_on,entry_type,currency,category_id,metadata)
        values($1,$2,$3,$4,$5,$6,'KRW','custom-category-loan-repayment',$7)
        on conflict(id) do update set amount=excluded.amount,metadata=excluded.metadata`,
        [id, book, owner, amount, date, type, JSON.stringify({ asset_link: details })],
      );
    }
    await insert(payment, 100);
    assert.equal(await balance(cash), 900);
    assert.equal(await balance(loan), 4920);
    await insert(payment, 100);
    assert.equal(await balance(cash), 900, "retries cannot deduct twice");
    await db.query("update ledger_entries set amount=150,metadata=$1 where id=$2", [
      JSON.stringify({ asset_link: { ...link, principal: "120" } }),
      payment,
    ]);
    assert.equal(await balance(cash), 850);
    assert.equal(await balance(loan), 4880);
    await assert.rejects(insert("20000000-0000-0000-0000-000000000002", 2000), /Insufficient cash/);
    assert.equal(
      Number((await db.query("select count(*) as n from ledger_entries")).rows[0].n),
      1,
      "entry must roll back with its movement",
    );
    await assert.rejects(
      insert("20000000-0000-0000-0000-000000000003", 100, { ...link, principal: "101" }),
      /Invalid repayment/,
    );
    await db.query("delete from ledger_entries where id=$1", [payment]);
    assert.equal(await balance(cash), 1000);
    assert.equal(await balance(loan), 5000);
    const income = "20000000-0000-0000-0000-000000000004";
    await insert(income, 500, { ...link, loanAssetId: null }, "income");
    await db.exec(
      `insert into receipt_files values('30000000-0000-0000-0000-000000000001','receipts','photo.jpg');`,
    );
    await db.query(
      `insert into ledger_entry_attachments(ledger_entry_id,receipt_file_id) values($1,'30000000-0000-0000-0000-000000000001')`,
      [income],
    );
    assert.equal(await balance(cash), 1500);
    await insert(payment, 1400, { ...link, loanAssetId: null });
    await assert.rejects(
      db.query("select public.delete_asset_linked_entry($1)", [income]),
      /Insufficient cash/,
    );
    assert.equal(
      await balance(cash),
      100,
      "deleting income cannot leave later transactions overdrawn",
    );
    assert.equal(
      (await db.query("select * from ledger_entry_attachments")).rows.length,
      1,
      "rejected deletion retains the photo",
    );
    await db.query("delete from ledger_entries where id=$1", [payment]);
    const removedFiles = await db.query("select public.delete_asset_linked_entry($1) as files", [
      income,
    ]);
    assert.equal(removedFiles.rows[0].files[0].storage_path, "photo.jpg");
    assert.equal((await db.query("select * from receipt_files")).rows.length, 0);
    // A manual balance becomes an authoritative checkpoint; earlier transactions are not double counted.
    await insert(payment, 100);
    await db.query(
      `select public.save_personal_asset($1,'cash','cash','','2020-01-03',$2,'${book}',false)`,
      [cash, JSON.stringify({ amount: "700" })],
    );
    assert.equal(await balance(cash), 700);
    assert.equal(await balance(cash, "2020-01-02"), 900);
    await insert(
      "20000000-0000-0000-0000-000000000005",
      50,
      { ...link, loanAssetId: null },
      "expense",
      "2020-01-04",
    );
    assert.equal(await balance(cash), 650);
    await assert.rejects(
      db.query(
        `select public.save_personal_asset($1,'cash','cash','','2020-01-03',$2,'${book}',false)`,
        [cash, JSON.stringify({ amount: "10" })],
      ),
      /Checkpoint would overdraw/,
    );
    assert.equal(await balance(cash), 650);
    // Private assets remain usable by their owner in a shared ledger.
    await db.query("insert into ledger_book_members values($1,$2,'editor')", [book, other]);
    await insert("20000000-0000-0000-0000-000000000006", 100);
    await db.query("delete from ledger_entries where id=$1", [
      "20000000-0000-0000-0000-000000000006",
    ]);
    await db.query("delete from ledger_book_members where user_id=$1", [other]);
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [other]);
    await db.exec("grant usage on schema public,auth to authenticated; set role authenticated;");
    assert.equal((await db.query("select * from personal_assets")).rows.length, 0);
    assert.equal((await db.query("select * from ledger_asset_movements")).rows.length, 0);
    await assert.rejects(db.query("delete from ledger_asset_movements"), /permission denied/);
    await assert.rejects(
      db.query(
        `select public.save_personal_asset($1,'loan','foreign','','2020-01-04',$2,'${book}',false)`,
        [loan, JSON.stringify({ amount: "1" })],
      ),
      /unavailable/,
    );
    await db.exec("reset role;");
    // Run the production portfolio reader against real table columns, not a permissive query mock.
    const client = modules({
      "src/lib/supabase.ts": {
        supabase: {
          from(table) {
            const order = [];
            let ownerId;
            const query = {
              select() {
                return query;
              },
              eq(column, value) {
                assert.equal(column, "book_id");
                ownerId = value;
                return query;
              },
              order(column) {
                order.push(column);
                return query;
              },
              async range(start, end) {
                try {
                  const result = await db.query(
                    `select * from public.${table} where book_id=$1 order by ${order.join(",")} limit $2 offset $3`,
                    [ownerId, end - start + 1, start],
                  );
                  return { data: result.rows, error: null };
                } catch (error) {
                  return { data: null, error };
                }
              },
            };
            return query;
          },
        },
      },
    })("src/lib/personalAssets.ts");
    const loaded = await client.fetchPersonalAssets(book);
    assert.equal(loaded.assets.length, 3);
    assert.equal(loaded.movements.length, 3);
    assert.equal(modules()("src/utils/assets.ts").assetBalance(loaded, cash, "2020-02-01"), 650);
    assert.ok(
      (
        await db.query(
          `select * from ledger_book_category_customizations where category_id='custom-category-loan-repayment'`,
        )
      ).rows.length,
    );
    // A shared book exposes only explicitly shared assets and their complete histories.
    await db.query("insert into ledger_book_members values($1,$2,'editor')", [book, other]);
    await db.query("update personal_assets set is_shared=true where id=$1", [cash]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    await db.exec("set role authenticated");
    assert.deepEqual(
      (await db.query("select id from personal_assets order by id")).rows.map((row) => row.id),
      [cash],
    );
    assert.ok(
      (await db.query("select * from personal_asset_valuations")).rows.every(
        (row) => row.asset_id === cash,
      ),
    );
    assert.ok(
      (await db.query("select * from ledger_asset_movements")).rows.every(
        (row) => row.asset_id === cash,
      ),
    );
    await assert.rejects(
      db.query(
        "select public.save_personal_asset($1,'cash','foreign','','2020-01-03',$2,$3,false)",
        [cash, JSON.stringify({ amount: "700" }), book],
      ),
      /unavailable/,
    );
    await assert.rejects(
      db.query("select public.delete_personal_asset($1,current_date)", [cash]),
      /unavailable/,
    );
    await db.exec("reset role");
    // Existing private links can be retained while another editor changes ledger amounts.
    await db.query("update ledger_entries set amount=110 where id=$1", [payment]);
    assert.equal(await balance(loan), 4920);
    await assert.rejects(
      db.query("update ledger_entries set metadata='{}' where id=$1", [payment]),
      /Private asset link/,
    );
    const sharedPayment = "20000000-0000-0000-0000-000000000007";
    await insert(sharedPayment, 10, { ...link, loanAssetId: null });
    assert.equal(
      (
        await db.query("select user_id from ledger_asset_movements where entry_id=$1", [
          sharedPayment,
        ])
      ).rows[0].user_id,
      owner,
    );
    await assert.rejects(insert("20000000-0000-0000-0000-000000000008", 100), /unavailable/);
    const foreignBook = "10000000-0000-0000-0000-000000000002";
    await db.query("insert into ledger_books values($1,$2)", [foreignBook, other]);
    await db.query("insert into ledger_book_members values($1,$2,'owner')", [foreignBook, other]);
    await assert.rejects(
      db.query("update ledger_entries set book_id=$1 where id=$2", [foreignBook, sharedPayment]),
      /unavailable/,
    );
    await db.query("select public.delete_asset_linked_entry($1)", [payment]);
    assert.equal(await balance(loan), 5000);
    await db.query("select public.delete_asset_linked_entry($1)", [sharedPayment]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.query(
      "select public.save_personal_asset($1,'cash','cash','','2020-01-03',$2,$3,false)",
      [cash, JSON.stringify({ amount: "700" }), book],
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    await db.exec("set role authenticated");
    assert.equal((await db.query("select * from personal_assets")).rows.length, 0);
    assert.equal((await db.query("select * from personal_asset_valuations")).rows.length, 0);
    assert.equal((await db.query("select * from ledger_asset_movements")).rows.length, 0);
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});

test("legacy assets migrate privately with balances and links preserved", async () => {
  const db = new PGlite();
  const user = "00000000-0000-0000-0000-000000000001";
  const book = "10000000-0000-0000-0000-000000000001";
  try {
    await db.exec(`create schema auth; create schema private; create role anon; create role authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table ledger_books(id uuid primary key,owner_id uuid);
      create table ledger_book_members(book_id uuid,user_id uuid,role text);
      create table ledger_entries(id uuid primary key,book_id uuid,user_id uuid,amount numeric,occurred_on date,entry_type text,currency text,category_id text,installment_group_id text,metadata jsonb);
      create function public.ensure_personal_ledger_book(p_user uuid,p_name text) returns uuid language sql as $$ select id from ledger_books where owner_id=p_user limit 1 $$;
      insert into auth.users values('${user}'); insert into ledger_books values('${book}','${user}');
      insert into ledger_book_members values('${book}','${user}','owner');
      select set_config('request.jwt.claim.sub','${user}',false);`);
    const migrations = path.join(__dirname, "../supabase/migrations");
    for (const file of fs
      .readdirSync(migrations)
      .filter((name) => /^20261101000[1-5]_/.test(name))
      .sort())
      await db.exec(fs.readFileSync(path.join(migrations, file), "utf8"));
    const saved = await db.query(
      "select public.save_personal_asset(null,'cash','legacy','','2020-01-01',$1) as id",
      [JSON.stringify({ amount: "1000" })],
    );
    const asset = saved.rows[0].id;
    await db.query(
      "insert into ledger_entries values('20000000-0000-0000-0000-000000000001',$1,$2,100,'2020-01-02','expense','KRW','food',null,$3)",
      [book, user, JSON.stringify({ asset_link: { cashAssetId: asset } })],
    );
    await db.exec(
      fs.readFileSync(path.join(migrations, "202611010006_scope_assets_to_books.sql"), "utf8"),
    );
    const row = (await db.query("select * from personal_assets")).rows[0];
    assert.equal(row.id, asset);
    assert.equal(row.book_id, book);
    assert.equal(row.is_shared, false);
    assert.equal(
      Number(
        (await db.query("select private.personal_asset_balance($1,'2020-02-01') as n", [asset]))
          .rows[0].n,
      ),
      900,
    );
    assert.equal(
      (await db.query("select book_id from ledger_asset_movements")).rows[0].book_id,
      book,
    );
    assert.equal(
      (await db.query("select book_id from personal_asset_valuations")).rows[0].book_id,
      book,
    );
    const details = {
      amount: "1000",
      institution: "Bank",
      maturity: "2030-12-31",
      kind: "savings",
    };
    const savings = (
      await db.query(
        "select public.save_personal_asset(null,'savings','Savings','note','2020-01-01',$1,$2,true) as id",
        [JSON.stringify(details), book],
      )
    ).rows[0].id;
    await db.exec(
      fs.readFileSync(path.join(migrations, "202611070002_merge_savings_into_cash.sql"), "utf8"),
    );
    const converted = (await db.query("select * from personal_assets where id=$1", [savings]))
      .rows[0];
    assert.equal(converted.kind, "cash");
    assert.equal(converted.name, "Savings");
    assert.equal(converted.note, "note");
    assert.equal(converted.is_shared, true);
    assert.equal(converted.book_id, book);
    assert.equal(converted.user_id, user);
    assert.deepEqual(
      (await db.query("select details from personal_asset_valuations where asset_id=$1", [savings]))
        .rows[0].details,
      details,
    );
    await db.query(
      "insert into ledger_entries values('20000000-0000-0000-0000-000000000002',$1,$2,100,'2020-01-02','expense','KRW','food',null,$3)",
      [book, user, JSON.stringify({ asset_link: { cashAssetId: savings } })],
    );
    assert.equal(
      Number(
        (await db.query("select private.personal_asset_balance($1,'2020-02-01') as n", [savings]))
          .rows[0].n,
      ),
      900,
    );
    await db.query(
      "select public.save_personal_asset($1,'cash','Savings','note','2020-02-01',$2,$3,true)",
      [savings, JSON.stringify({ ...details, amount: "1200", kind: "cash" }), book],
    );
    assert.equal(
      (await db.query("select * from personal_asset_valuations where asset_id=$1", [savings])).rows
        .length,
      2,
    );
  } finally {
    await db.close();
  }
});
