import type { ReactNode } from "react";
import { Linking,Pressable,ScrollView,StyleSheet,Text,View } from "react-native";
import { Feather } from "../components/AppIcons";
import { MenuStyles } from "../constants/menuStyles";
import { AppScrollBehavior } from "../constants/scroll";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { AppColors } from "../constants/colors";
import { HelpCopy,HelpLinkItems,HelpUi } from "../constants/help";
import { ReadingTextProps } from "../constants/textLayout";
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
        <Text accessibilityRole="header" style={MenuStyles.sectionTitle}>{HelpCopy.linksTitle}</Text>
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
    gap: MenuStyles.section.gap,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  content: {
    ...MenuStyles.content,
  },
  description: MenuStyles.description,
  linkList: {
    ...MenuStyles.group,
    gap: 0,
    paddingVertical: 0,
  },
  linkRow: MenuStyles.row,
  lastLinkRow: {
    borderBottomWidth: 0,
  },
  linkTextBlock: MenuStyles.textBlock,
  linkLabel: MenuStyles.title,
  linkDescription: MenuStyles.description,
});
