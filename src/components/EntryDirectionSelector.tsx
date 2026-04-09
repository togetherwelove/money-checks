import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { EntryDirectionCopy } from "../constants/entryDirection";
import type { LedgerEntryType } from "../types/ledger";

type EntryDirectionSelectorProps = {
  onSelectType: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
};

export function EntryDirectionSelector({
  onSelectType,
  selectedType,
}: EntryDirectionSelectorProps) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        {(
          Object.entries(EntryDirectionCopy) as Array<
            [LedgerEntryType, (typeof EntryDirectionCopy)[LedgerEntryType]]
          >
        ).map(([type, copy]) => {
          const isActive = selectedType === type;

          return (
            <Pressable
              key={type}
              onPress={() => onSelectType(type)}
              style={[styles.card, isActive && styles.activeCard]}
            >
              <Text style={[styles.label, isActive && styles.activeLabel]}>{copy.label}</Text>
              <Text style={[styles.description, isActive && styles.activeDescription]}>
                {copy.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
  },
  activeCard: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  label: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  activeLabel: {
    color: AppColors.primary,
  },
  description: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  activeDescription: {
    color: AppColors.primary,
  },
});
