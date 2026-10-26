const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const load = modules();
const { createDraft, createDraftFromEntry } = load('src/utils/ledgerEntries.ts');
const { hasEntryComposerValues, hasEntryComposerChanges } = load('src/utils/entryComposer.ts');

test('default date, member, type and payment do not count as user-entered values', () => {
  const draft = createDraft('2026-10-25', 'self');
  assert.equal(hasEntryComposerValues(draft, draft.date, 'self'), false);
  assert.equal(hasEntryComposerValues({ ...draft, targetMemberId: 'fallback', targetMemberName: 'Default member' }, draft.date, 'fallback'), false);
});

test('partial text, photos, category and changes to date, type, payment or member require confirmation', () => {
  const draft = createDraft('2026-10-25', 'self');
  for (const change of [ { amount: '1' }, { content: 'Lunch' }, { note: 'Memo' },
    { categoryId: 'food' }, { category: 'Food' }, { photoAttachments: [{ uri: 'local' }] },
    { date: '2026-10-24' }, { type: 'income' }, { installmentMonths: 2 }, { targetMemberId: 'other' } ]) {
    assert.equal(hasEntryComposerValues({ ...draft, ...change }, draft.date, 'self'), true, JSON.stringify(change));
  }
});

test('unchanged edits and reverted values do not require discard confirmation', () => {
  const entry = { ...createDraft('2026-10-25', 'self'), id: 'entry', amount: 1200,
    content: 'Lunch', categoryId: 'food', category: 'Food', targetMemberId: undefined,
    authorId: 'other', installmentMonths: null, photoAttachments: [{ id: 'photo', uri: 'remote', fileName: 'photo.jpg' }] };
  const draft = createDraftFromEntry(entry, 'self');
  assert.equal(hasEntryComposerChanges(draft, entry, 'self'), false);
  for (const change of [{ amount: '1300' }, { content: 'Dinner' }, { note: 'Memo' },
    { date: '2026-10-24' }, { type: 'income' }, { categoryId: 'other' },
    { targetMemberId: 'self' }, { installmentMonths: 2 }, { photoAttachments: [] },
    { photoAttachments: [{ ...draft.photoAttachments[0], uri: 'new' }] }]) {
    assert.equal(hasEntryComposerChanges({ ...draft, ...change }, entry, 'self'), true, JSON.stringify(change));
  }
  draft.content = 'Dinner';
  draft.content = entry.content;
  assert.equal(hasEntryComposerChanges(draft, entry, 'self'), false);
});
