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
import {
  EntryDirectionCopy,
  EntryDirectionLayout,
  EntryDirectionOrder,
} from "../constants/entryDirection";
import type { LedgerEntryType } from "../types/ledger";

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
    () => Math.max(0, EntryDirectionOrder.indexOf(selectedType)),
    [selectedType],
  );

  const optionWidth = useMemo(() => {
    if (!rowWidth) {
      return 0;
    }

    const totalGap = EntryDirectionLayout.optionGap * (EntryDirectionLayout.optionCount - 1);
    return (rowWidth - totalGap) / EntryDirectionLayout.optionCount;
  }, [rowWidth]);

  useEffect(() => {
    if (!optionWidth) {
      return;
    }

    const nextOffset = selectedIndex * (optionWidth + EntryDirectionLayout.optionGap);
    Animated.timing(slideValue, {
      toValue: nextOffset,
      duration: EntryDirectionLayout.slideDurationMs,
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
        {EntryDirectionOrder.map((type) => {
          const isActive = selectedType === type;

          return (
            <Pressable key={type} onPress={() => onSelectType(type)} style={styles.option}>
              <Text style={[styles.optionLabel, isActive && styles.activeOptionLabel]}>
                {EntryDirectionCopy[type].label}
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
    padding: EntryDirectionLayout.containerInset,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: EntryDirectionLayout.containerRadius,
    backgroundColor: AppColors.surfaceMuted,
  },
  row: {
    position: "relative",
    flexDirection: "row",
    gap: EntryDirectionLayout.optionGap,
  },
  sliderThumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: EntryDirectionLayout.optionRadius,
    backgroundColor: AppColors.surfaceStrong,
  },
  option: {
    flex: 1,
    minHeight: EntryDirectionLayout.optionMinHeight,
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
