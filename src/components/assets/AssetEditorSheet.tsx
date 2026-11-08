import { useRef, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { AssetCopy as Copy, AssetKinds } from "../../constants/assets";
import { AssetStyles as styles } from "../../constants/assetStyles";
import { savePersonalAsset, deletePersonalAsset } from "../../lib/personalAssets";
import type { AssetValuation, PersonalAsset } from "../../types/asset";
import {
  assetDraftError,
  assetKind,
  createAssetDraft,
  draftFromAsset,
  formatAssetAmount,
} from "../../utils/assets";
import { NativeSelectionSheet } from "../NativeSelectionSheet";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import { AssetDraftFields } from "./AssetDraftFields";
import { editableLoanSettings, loanSettingsError } from "../../utils/loanRepayment";
import { AssetLinkCopy } from "../../constants/assetLink";
import type { AssetMovement } from "../../types/assetLink";

export function AssetEditorSheet({
  asset,
  history,
  onClose,
  onSaved,
  currentAmount,
  userId,
  bookId,
  movements = [],
}: {
  asset: PersonalAsset | null;
  history: AssetValuation[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  currentAmount?: number;
  userId?: string;
  bookId: string;
  movements?: AssetMovement[];
}) {
  const [initial] = useState(() =>
    editableLoanSettings(
      asset && history[0]
        ? {
            ...draftFromAsset(asset, history[0]),
            ...((asset.kind === "cash" || asset.kind === "loan") && currentAmount !== undefined
              ? { amount: String(currentAmount) }
              : {}),
          }
        : createAssetDraft(),
    ),
  );
  const [draft, setDraft] = useState(initial);
  const [shared, setShared] = useState(asset?.is_shared ?? false);
  const readOnly = Boolean(asset && asset.user_id !== userId);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    JSON.stringify(initial) !== JSON.stringify(draft) || shared !== (asset?.is_shared ?? false);
  const validation = assetDraftError(draft) ?? loanSettingsError(draft);
  function close() {
    if (savingRef.current) return;
    if (!dirty) {
      onClose();
      return;
    }
    Alert.alert(Copy.discardTitle, Copy.discardMessage, [
      { text: Copy.cancel, style: "cancel" },
      { text: Copy.discard, style: "destructive", onPress: onClose },
    ]);
  }
  async function persist(remove = false) {
    if (readOnly || savingRef.current || (!remove && validation)) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (remove && asset) await deletePersonalAsset(asset.id);
      else await savePersonalAsset(asset?.id ?? null, draft, bookId, shared);
    } catch {
      setError(remove ? Copy.deleteError : Copy.saveError);
      savingRef.current = false;
      setSaving(false);
      return;
    }
    onClose();
    await onSaved();
  }
  return (
    <NativeSelectionSheet
      isOpen
      title={readOnly ? Copy.view : asset ? Copy.edit : Copy.add}
      onClose={close}
      dismissible={!saving}
      requiresCloseConfirmation={dirty}
      action={
        readOnly
          ? undefined
          : {
              label: Copy.save,
              disabled: readOnly || Boolean(validation),
              loading: saving,
              onPress: () => {
                void persist();
              },
            }
      }
    >
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <View style={styles.section} pointerEvents={saving ? "none" : "auto"}>
          <Text style={styles.label}>{Copy.kind}</Text>
          {asset ? (
            <Text style={styles.title}>{assetKind(asset.kind).label}</Text>
          ) : (
            <View style={styles.wrap}>
              {AssetKinds.map((kind) => (
                <Pressable
                  key={kind.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: kind.id === draft.kind }}
                  onPress={() => setDraft((value) => ({ ...value, kind: kind.id }))}
                  style={[styles.chip, kind.id === draft.kind && styles.selected]}
                >
                  <Text style={[styles.text, kind.id === draft.kind && styles.selectedText]}>
                    {kind.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <AssetDraftFields
            userId={userId}
            bookId={bookId}
            shared={shared}
            draft={draft}
            update={(key, value) => {
              if (readOnly) return;
              setDraft((current) => ({ ...current, [key]: value }));
              setError(null);
            }}
            disabled={saving || readOnly}
            expanded={expanded}
            onToggleDetails={() => setExpanded((value) => !value)}
          />
          <View style={styles.row}>
            <Text style={styles.label}>{Copy.shareWithMembers}</Text>
            <Switch
              accessibilityLabel={Copy.shareWithMembers}
              value={shared}
              disabled={saving || readOnly}
              onValueChange={setShared}
            />
          </View>
          <Text style={styles.hint}>{shared ? Copy.sharingHint : Copy.private}</Text>
          {readOnly ? <Text style={styles.hint}>{Copy.sharedReadOnly}</Text> : null}
          {asset && (asset.kind === "cash" || asset.kind === "loan") ? (
            <Text style={styles.hint}>{AssetLinkCopy.baseline}</Text>
          ) : null}
        </View>
        {validation && validation !== Copy.invalid && dirty ? (
          <Text style={styles.error}>{validation}</Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {history.length ? (
          <View style={styles.section}>
            <Text style={styles.title}>{Copy.history}</Text>
            <Text style={styles.hint}>{Copy.historyHint}</Text>
            {history.map((value) => (
              <View key={value.id} style={styles.row}>
                <Text style={styles.hint}>
                  {value.valued_on}
                  {Copy.separator}
                  {Copy.manual}
                </Text>
                <Text style={styles.text}>{formatAssetAmount(Number(value.amount))}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {movements.length ? (
          <View style={styles.section}>
            <Text style={styles.title}>{AssetLinkCopy.movementHistory}</Text>
            {movements.map((movement) => (
              <View key={movement.entry_id} style={styles.row}>
                <Text style={styles.hint}>{movement.occurred_on}</Text>
                <Text style={styles.text}>{formatAssetAmount(Number(movement.amount))}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {asset && !readOnly ? (
          <Pressable
            accessibilityRole="button"
            disabled={saving || readOnly}
            style={styles.row}
            onPress={() =>
              Alert.alert(Copy.deleteTitle, Copy.deleteMessage, [
                { text: Copy.cancel, style: "cancel" },
                {
                  text: Copy.delete,
                  style: "destructive",
                  onPress: () => {
                    void persist(true);
                  },
                },
              ])
            }
          >
            <Text style={styles.delete}>{Copy.delete}</Text>
          </Pressable>
        ) : null}
      </KeyboardAwareScrollView>
    </NativeSelectionSheet>
  );
}
