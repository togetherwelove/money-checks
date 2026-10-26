import { AppScrollBehavior } from "../constants/scroll";
import { Feather } from "../components/AppIcons";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { HelpCopy, HelpLinkItems, HelpUi } from "../constants/help";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { ReadingTextProps } from "../constants/textLayout";
import {
  CardTitleTextStyle,
  ListGroupStyle,
  ResponsivePageContentStyle,
  SupportingTextStyle,
} from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";

type HelpScreenProps = {
  screenTitle: ReactNode;
  onOpenFaq: () => void;
};

export function HelpScreen({ screenTitle, onOpenFaq }: HelpScreenProps) {
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
        <Text accessibilityRole="header" style={CardTitleTextStyle}>{HelpCopy.linksTitle}</Text>
        <Text {...ReadingTextProps} style={styles.description}>
          {HelpCopy.linksDescription}
        </Text>
        <View style={styles.linkList}>
          <Pressable accessibilityRole="button" onPress={onOpenFaq} style={styles.linkRow}>
            <View style={styles.linkTextBlock}>
              <Text style={styles.linkLabel}>{HelpCopy.faqTitle}</Text>
              <Text {...ReadingTextProps} style={styles.linkDescription}>{HelpCopy.faqLinkDescription}</Text>
            </View>
            <Feather color={AppColors.mutedStrongText} name="chevron-right" size={HelpUi.iconSize} />
          </Pressable>
          {HelpLinkItems.map((item, index) => (
            <Pressable
              accessibilityRole="link"
              key={item.url}
              onPress={() => void handleOpenLink(item.url)}
              style={[
                styles.linkRow,
                index === HelpLinkItems.length - 1 ? styles.lastLinkRow : null,
              ]}
            >
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkLabel}>{item.label}</Text>
                <Text {...ReadingTextProps} style={styles.linkDescription}>
                  {item.description}
                </Text>
              </View>
              <Feather color={AppColors.mutedStrongText} name="external-link" size={HelpUi.iconSize} />
            </Pressable>
          ))}
        </View>
        <AppFooterContentInset />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: AppLayout.cardGap,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  content: {
    ...ResponsivePageContentStyle,
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  description: {
    ...SupportingTextStyle,
    color: AppColors.mutedStrongText,
  },
  linkList: {
    ...ListGroupStyle,
    gap: 0,
    paddingVertical: 0,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AppLayout.cardGap,
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingVertical: HelpUi.rowVerticalPadding,
    borderBottomWidth: AppLayout.dividerWidth,
    borderBottomColor: AppColors.border,
  },
  lastLinkRow: {
    borderBottomWidth: 0,
  },
  linkTextBlock: {
    flex: 1,
    gap: AppLayout.compactGap,
  },
  linkLabel: {
    color: AppColors.text,
    fontSize: HelpUi.questionFontSize,
    fontWeight: "700",
  },
  linkDescription: {
    ...SupportingTextStyle,
    color: AppColors.mutedStrongText,
  },
});
