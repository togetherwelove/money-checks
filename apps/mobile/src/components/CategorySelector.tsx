import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";

type CategorySelectorProps = {
  categories: readonly string[];
  selectedCategory: string;
  title: string;
  onSelectCategory: (category: string) => void;
};

export function CategorySelector({
  categories,
  selectedCategory,
  title,
  onSelectCategory,
}: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.options}>
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => onSelectCategory(category)}
            style={[styles.option, selectedCategory === category && styles.activeOption]}
          >
            <Text
              style={[styles.optionText, selectedCategory === category && styles.activeOptionText]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
  },
  optionText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  activeOption: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  activeOptionText: {
    color: AppColors.primary,
    fontWeight: "700",
  },
});
