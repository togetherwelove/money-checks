import { SettingsGroup } from "../components/appSettings/SettingsGroup";
import { getSettingsGroupStyles } from "../constants/settingsGroupStyles";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "../components/AppIcons";
import { getMenuStyles } from "../constants/menuStyles";
import { AppScrollBehavior } from "../constants/scroll";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { getAppColors } from "../constants/colors";
import { HelpCopy, HelpLinkItems, HelpUi } from "../constants/help";
import { showNativeToast } from "../lib/nativeToast";

type HelpScreenProps = {
  screenTitle: ReactNode;
  onOpenFaq: () => void;
};

export function HelpScreen({ screenTitle, onOpenFaq }: HelpScreenProps) {
  const styles = getStyles();
  useAppTheme();
  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(HelpCopy.linkError);
    }
  };

  return (
    <ScrollView {...AppScrollBehavior} contentContainerStyle={styles.content} style={styles.screen}>
      {screenTitle}
      <View style={styles.sections}>
        <SettingsGroup description={HelpCopy.faqLinkDescription}>
          <Pressable accessibilityRole="button" onPress={onOpenFaq} style={styles.linkRow}>
            <View style={styles.linkTextBlock}>
              <Text style={styles.linkLabel}>{HelpCopy.faqTitle}</Text>
            </View>
            <Feather
              color={getAppColors().mutedStrongText}
              name="chevron-right"
              size={HelpUi.iconSize}
            />
          </Pressable>
        </SettingsGroup>
        {HelpLinkItems.map((item) => (
          <SettingsGroup key={item.url} description={item.description}>
            <Pressable
              accessibilityRole="link"
              onPress={() => void handleOpenLink(item.url)}
              style={styles.linkRow}
            >
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkLabel}>{item.label}</Text>
              </View>
              <Feather
                color={getAppColors().mutedStrongText}
                name="external-link"
                size={HelpUi.iconSize}
              />
            </Pressable>
          </SettingsGroup>
        ))}
        <AppFooterContentInset />
      </View>
    </ScrollView>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    sections: {
      gap: getSettingsGroupStyles().sections.gap,
    },
    screen: {
      flex: 1,
      backgroundColor: getAppColors().screenBackground,
    },
    content: {
      ...getSettingsGroupStyles().page,
    },
    linkRow: getSettingsGroupStyles().row,
    linkTextBlock: getMenuStyles().textBlock,
    linkLabel: getSettingsGroupStyles().label,
  }),
);
