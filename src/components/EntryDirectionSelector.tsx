import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppColors } from "../constants/colors";
import { selectStaticCopy } from "../i18n/staticCopy";
import type { LedgerEntryType } from "../types/ledger";

const ENTRY_DIRECTION_LABELS = selectStaticCopy<Record<LedgerEntryType, string>>({
  en: {
    expense: "Expense",
    income: "Income",
  },
  ko: {
    expense: "지출",
    income: "수입",
  },
});
const ENTRY_DIRECTION_ORDER: LedgerEntryType[] = ["expense", "income"];
const ENTRY_DIRECTION_OPTION_GAP = 4;
const ENTRY_DIRECTION_CONTAINER_INSET = 4;
const ENTRY_DIRECTION_CONTAINER_RADIUS = 18;
const ENTRY_DIRECTION_OPTION_RADIUS = 14;
const ENTRY_DIRECTION_OPTION_MIN_HEIGHT = 44;
const ENTRY_DIRECTION_SLIDE_DURATION_MS = 180;

type EntryDirectionSelectorProps = {
  onSelectType: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
};

export function EntryDirectionSelector({
  onSelectType,
  selectedType,
}: EntryDirectionSelectorProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const slideValue = useRef(new Animated.Value(0)).current;

  const selectedIndex = useMemo(
    () => Math.max(0, ENTRY_DIRECTION_ORDER.indexOf(selectedType)),
    [selectedType],
  );

  const optionWidth = useMemo(() => {
    if (!rowWidth) {
      return 0;
    }

    const totalGap = ENTRY_DIRECTION_OPTION_GAP * (ENTRY_DIRECTION_ORDER.length - 1);
    return (rowWidth - totalGap) / ENTRY_DIRECTION_ORDER.length;
  }, [rowWidth]);

  useEffect(() => {
    if (!optionWidth) {
      return;
    }

    const nextOffset = selectedIndex * (optionWidth + ENTRY_DIRECTION_OPTION_GAP);
    Animated.timing(slideValue, {
      toValue: nextOffset,
      duration: ENTRY_DIRECTION_SLIDE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [optionWidth, selectedIndex, slideValue]);

  const handleRowLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth === rowWidth) {
      return;
    }

    setRowWidth(nextWidth);
    if (!optionWidth) {
      slideValue.setValue(selectedIndex * nextWidth * 0.5);
    }
  };

  return (
    <View style={styles.segmentedControl}>
      <View onLayout={handleRowLayout} style={styles.row}>
        {optionWidth ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sliderThumb,
              {
                width: optionWidth,
                transform: [{ translateX: slideValue }],
              },
            ]}
          />
        ) : null}
        {ENTRY_DIRECTION_ORDER.map((type) => {
          const isActive = selectedType === type;

          return (
            <Pressable key={type} onPress={() => onSelectType(type)} style={styles.option}>
              <Text style={[styles.optionLabel, isActive && styles.activeOptionLabel]}>
                {ENTRY_DIRECTION_LABELS[type]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    padding: ENTRY_DIRECTION_CONTAINER_INSET,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: ENTRY_DIRECTION_CONTAINER_RADIUS,
    backgroundColor: AppColors.surfaceMuted,
  },
  row: {
    position: "relative",
    flexDirection: "row",
    gap: ENTRY_DIRECTION_OPTION_GAP,
  },
  sliderThumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: ENTRY_DIRECTION_OPTION_RADIUS,
    backgroundColor: AppColors.surfaceStrong,
  },
  option: {
    flex: 1,
    minHeight: ENTRY_DIRECTION_OPTION_MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    zIndex: 1,
  },
  optionLabel: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  activeOptionLabel: {
    color: AppColors.primary,
  },
});
