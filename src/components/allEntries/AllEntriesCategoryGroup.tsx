import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AllEntriesFilterDesign as Design } from "../../constants/allEntries";
import { getAllEntriesFilterStyles } from "../../constants/allEntriesFilterStyles";
import { SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { getAppColors } from "../../constants/colors";
import type { CategoryDefinition } from "../../types/category";
import type { LedgerEntryType } from "../../types/ledger";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Feather } from "../AppIcons";

type Props = {
  categories: readonly CategoryDefinition[];
  onToggle: (id: string) => void;
  selectedCategoryIdSet: ReadonlySet<string>;
  title: string;
  type: LedgerEntryType;
};
export function AllEntriesCategoryGroup({
  categories,
  onToggle,
  selectedCategoryIdSet,
  title,
  type,
}: Props) {
  useAppTheme();
  const [width, setWidth] = useState(0);
  const styles = getAllEntriesFilterStyles();
  const count = categories.filter((category) => selectedCategoryIdSet.has(category.id)).length;
  const tileWidth =
    width > 0
      ? {
          flexBasis:
            (width - SettingsGroupDesign.titleGap * (Design.categoryColumns - 1)) /
            Design.categoryColumns,
        }
      : undefined;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.count}>
          {count}/{categories.length}
        </Text>
      </View>
      <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {categories.map((category) => {
          const selected = selectedCategoryIdSet.has(category.id);
          return (
            <Pressable
              key={category.id}
              accessibilityRole="checkbox"
              accessibilityLabel={category.label}
              accessibilityState={{ checked: selected }}
              onPress={() => onToggle(category.id)}
              style={[styles.tile, tileWidth, selected && styles.selected]}
            >
              <Feather
                name={category.iconName}
                size={SettingsGroupDesign.iconSize}
                color={type === "income" ? getAppColors().income : getAppColors().expense}
              />
              <Text numberOfLines={2} style={[styles.tileLabel, selected && styles.selectedLabel]}>
                {category.label}
              </Text>
              {selected ? (
                <View style={styles.selectionBadge}>
                  <Feather
                    name="check"
                    size={Design.selectionIconSize}
                    color={getAppColors().onPrimary}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
