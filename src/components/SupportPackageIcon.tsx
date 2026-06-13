import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import {
  SupportPackageCatalog,
  type SupportPackageIdentifier,
  SupportUi,
} from "../constants/support";

type SupportPackageIconProps = {
  identifier: SupportPackageIdentifier;
};

export function SupportPackageIcon({ identifier }: SupportPackageIconProps) {
  const packageCatalogItem = SupportPackageCatalog.find((item) => item.identifier === identifier);

  if (!packageCatalogItem) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: packageCatalogItem.iconBackgroundColor }]}>
      <MaterialCommunityIcons
        color={packageCatalogItem.iconColor}
        name={packageCatalogItem.iconName}
        size={SupportUi.iconSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SupportUi.iconContainerSize,
    height: SupportUi.iconContainerSize,
    borderRadius: SupportUi.iconContainerRadius,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
