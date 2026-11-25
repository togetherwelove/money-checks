const assert = require("node:assert/strict");

async function verifyCurrentAssetBalances({ db, owner, other, book, cash, link, insert, balance }) {
  // Closing a month freezes the pre-change amount, even if cron has not run yet.
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
  const beforeClose = await balance(cash);
  await db.exec(
    "update private.asset_snapshot_checkpoint set open_month=(date_trunc('month',clock_timestamp() at time zone 'Asia/Seoul')-interval '1 month')::date",
  );
  const backdated = "20000000-0000-0000-0000-000000000099";
  await insert(backdated, 50, { ...link, loanAssetId: null }, "expense", "1901-01-01");
  assert.equal(
    await balance(cash),
    beforeClose - 50,
    "backdated entries affect the current balance",
  );
  const frozen = await db.query("select amount from asset_monthly_snapshots where asset_id=$1", [
    cash,
  ]);
  assert.equal(Number(frozen.rows[0].amount), beforeClose);
  await db.query("update ledger_entries set amount=70,occurred_on='1900-01-01' where id=$1", [
    backdated,
  ]);
  assert.equal(await balance(cash), beforeClose - 70);
  await db.query("delete from ledger_entries where id=$1", [backdated]);
  assert.equal(await balance(cash), beforeClose);
  await db.query("select private.close_asset_months()");
  assert.equal(
    Number(
      (await db.query("select amount from asset_monthly_snapshots where asset_id=$1", [cash]))
        .rows[0].amount,
    ),
    beforeClose,
  );
  assert.equal(
    (await db.query("select * from asset_monthly_snapshots where asset_id=$1", [cash])).rows.length,
    1,
  );
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
  await db.exec("set role authenticated");
  assert.deepEqual(
    (await db.query("select distinct asset_id from asset_monthly_snapshots")).rows.map(
      (row) => row.asset_id,
    ),
    [cash],
    "only shared monthly records are visible",
  );
  await assert.rejects(
    db.query("select public.confirm_cash_asset_balance($1,$2,$3,$4)", [cash, book, beforeClose, 0]),
    /Asset unavailable/,
  );
  await assert.rejects(
    db.query("update asset_monthly_snapshots set amount=0"),
    /permission denied/,
  );
  await db.exec("reset role");

  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
  const current = await balance(cash);
  await db.query("select public.save_personal_asset($1,'cash','Renamed','',null,$2,$3,false)", [
    cash,
    JSON.stringify({ amount: "1", replaceBalance: false }),
    book,
  ]);
  assert.equal(await balance(cash), current, "metadata-only edits cannot reset a balance");
  await db.query("select public.save_personal_asset($1,'cash','cash','',null,$2,$3,true)", [
    cash,
    JSON.stringify({ amount: String(current + 10) }),
    book,
  ]);
  assert.equal(await balance(cash), current + 10, "manual amounts replace the current balance");
  const check = (expected, amount) =>
    db.query("select public.confirm_cash_asset_balance($1,$2,$3,$4)", [
      cash,
      book,
      expected,
      amount,
    ]);
  const readConfirmation = async () =>
    (await db.query("select last_balance_checked_on from personal_assets where id=$1", [cash]))
      .rows[0].last_balance_checked_on;
  assert.equal(await readConfirmation(), null, "ordinary edits do not confirm the cash balance");
  await assert.rejects(check(current, 0), { code: "PT409" });
  await assert.rejects(check(current + 10, 1.001), /Invalid amount/);
  assert.equal(await balance(cash), current + 10);
  await check(current + 10, current + 10);
  assert.ok(await readConfirmation(), "a matching amount still records the confirmation date");
  await check(current + 10, current + 20);
  assert.equal(await balance(cash), current + 20, "a confirmed difference replaces the balance");
  assert.equal(
    Number(
      (await db.query("select amount from asset_monthly_snapshots where asset_id=$1", [cash]))
        .rows[0].amount,
    ),
    beforeClose,
    "confirming the current cash balance preserves closed months",
  );
  await db.query("select public.save_personal_asset($1,'cash','cash','',null,$2,$3,true)", [
    cash,
    JSON.stringify({ amount: "10" }),
    book,
  ]);
  await assert.rejects(insert(backdated, 20, { ...link, loanAssetId: null }), /Insufficient cash/);
  assert.equal(await balance(cash), 10, "rejected transactions roll back their balance changes");
  await db.query("select public.save_personal_asset($1,'cash','cash','',null,$2,$3,true)", [
    cash,
    JSON.stringify({ amount: String(current) }),
    book,
  ]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
}
module.exports = { verifyCurrentAssetBalances };
