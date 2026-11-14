import { MenuView } from "@react-native-menu/menu";
import { Pressable, StyleSheet, View } from "react-native";
import {
  CategoryContextMenuCopy,
  CategoryCustomizerCopy,
} from "../../constants/categoryCustomizer";
import type { CategoryGridPosition } from "../../lib/categoryGrid";
import type { CategoryDefinition } from "../../types/category";
import { CategoryGridItem } from "./CategoryGridItem";

const menuActions = [
  { id: "edit", title: CategoryContextMenuCopy.editAction, image: "pencil" },
  {
    id: "delete",
    title: CategoryCustomizerCopy.deleteAction,
    image: "trash",
    attributes: { destructive: true },
  },
];

type Props = {
  category: CategoryDefinition;
  cellSize: number;
  position: CategoryGridPosition;
  isSelected: boolean;
  disabled: boolean;
  onPress: () => void;
  onEdit?: (category: CategoryDefinition) => void;
  onDelete?: (category: CategoryDefinition) => void;
};

export function CategoryManageTile({
  category,
  cellSize,
  position,
  isSelected,
  disabled,
  onPress,
  onEdit,
  onDelete,
}: Props) {
  const content = (
    <View pointerEvents="none">
      <CategoryGridItem category={category} cellSize={cellSize} isActive={isSelected} />
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.label}
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.tile,
        { width: cellSize, height: cellSize, left: position.x, top: position.y },
      ]}
    >
      {!disabled && (onEdit || onDelete) ? (
        <MenuView
          actions={menuActions}
          shouldOpenOnLongPress
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === "edit") onEdit?.(category);
            if (nativeEvent.event === "delete") onDelete?.(category);
          }}
        >
          {content}
        </MenuView>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({ tile: { position: "absolute" } });
