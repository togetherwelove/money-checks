import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { EntryComposerUi } from "../../constants/entryComposer";
import { InstallmentConversionCopy as Copy } from "../../constants/installmentConversion";
import { convertInstallmentToOneTime, previewInstallmentConversion } from "../../lib/installmentConversion";
import { fetchLedgerEntriesByInstallmentGroup } from "../../lib/ledgerEntries";
import { logAppError } from "../../lib/logAppError";
import type { LedgerEntry } from "../../types/ledger";
import { formatCurrency, toIsoDate } from "../../utils/calendar";
import { ActionButton } from "../ActionButton";
import { EntryDateSelector } from "../EntryDateSelector";
import { CalendarPickerModalShell } from "../calendarPicker/CalendarPickerModalShell";

type Props = { bookId: string; groupId: string; onClose: () => void; onConverted: () => void };

export function InstallmentConversionModal({ bookId, groupId, onClose, onConverted }: Props) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void fetchLedgerEntriesByInstallmentGroup(bookId, groupId, { includePhotoAttachments: false })
      .then((rows) => { if (mounted.current) setEntries(rows); })
      .catch((cause) => {
        logAppError("InstallmentConversion", cause, { step: "preview" });
        if (mounted.current) setError(Copy.error);
      })
      .finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [bookId, groupId]);
  const preview = previewInstallmentConversion(entries, paidIds);
  const title = preview.paidCount ? Copy.partial : Copy.full;
  const commit = async () => {
    if (submitting.current || !mounted.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await convertInstallmentToOneTime(bookId, groupId, entries, paidIds, date);
    } catch (cause) {
      logAppError("InstallmentConversion", cause, { step: "convert" });
      if (mounted.current) { setError(Copy.error); setBusy(false); }
      submitting.current = false;
      return;
    }
    if (mounted.current) onConverted();
  };
  return <CalendarPickerModalShell isOpen title={Copy.title} onClose={() => { if (!submitting.current) onClose(); }}>
    <Text style={styles.text}>{Copy.instructions}</Text>
    <Text style={styles.hint}>{Copy.savedOnly}</Text>
    {loading ? <Text style={styles.text}>{Copy.loading}</Text> : entries.map((entry) => {
      const paid = paidIds.includes(entry.id);
      return <Pressable key={entry.id} accessibilityRole="checkbox" accessibilityState={{ checked: paid, disabled: busy }} disabled={busy}
        onPress={() => setPaidIds((current) => paid ? current.filter((id) => id !== entry.id) : [...current, entry.id])}
        style={[styles.row, paid && styles.paid]}>
        <Text style={styles.text}>{entry.date} · {entry.content}{"\n"}{formatCurrency(entry.amount)}</Text>
        <Text style={styles.hint}>{paid ? Copy.paid : Copy.unpaid}</Text>
      </Pressable>;
    })}
    <View pointerEvents={busy ? "none" : "auto"}>
      <Text style={styles.hint}>{Copy.date}</Text>
      <EntryDateSelector selectedDate={date} onSelectDate={setDate} />
    </View>
    <Text style={styles.total}>{title} · {formatCurrency(preview.totalAmount)}</Text>
    {!loading && !preview.remaining.length ? <Text style={styles.hint}>{Copy.empty}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.hint}>{error}</Text> : null}
    <ActionButton variant="primary" label={Copy.confirm} loading={busy}
      disabled={loading || busy || Boolean(error) || !preview.remaining.length}
      onPress={() => Alert.alert(title,
        `${Copy.total}: ${formatCurrency(preview.totalAmount)}\n${Copy.date}: ${date}\n\n${preview.remaining.map((entry) => `${entry.date} · ${entry.content} · ${formatCurrency(entry.amount)}`).join("\n")}\n\n${Copy.savedOnly}`,
        [{ text: Copy.cancel, style: "cancel" }, { text: Copy.confirm, onPress: () => { void commit(); } }])} />
  </CalendarPickerModalShell>;
}

const styles = StyleSheet.create({
  text: { color: AppColors.text, fontSize: EntryComposerUi.summaryFontSize },
  hint: { color: AppColors.mutedText, fontSize: EntryComposerUi.detailsFontSize },
  total: { color: AppColors.primary, fontWeight: "700", fontSize: EntryComposerUi.fontSize },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: AppLayout.cardGap, padding: AppLayout.cardContentPadding, borderWidth: AppLayout.dividerWidth, borderColor: AppColors.border, borderRadius: AppLayout.groupRadius },
  paid: { backgroundColor: AppColors.surfaceStrong, borderColor: AppColors.primary },
});
