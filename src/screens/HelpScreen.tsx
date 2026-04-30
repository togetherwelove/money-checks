import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { SignedInStackParamList } from "../app/signedInNavigation";
import { AppColors } from "../constants/colors";
import { HelpCopy } from "../constants/help";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { OpenSourceLicensesCopy } from "../constants/openSourceLicenses";
import { SupportingTextStyle, SurfaceCardStyle } from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";

type HelpLinkItem = {
  description: string;
  label: string;
  url: string;
};

const HELP_LINK_ITEMS: HelpLinkItem[] = [
  {
    description: HelpCopy.privacyPolicyDescription,
    label: HelpCopy.privacyPolicyLabel,
    url: LegalLinks.privacyPolicyUrl,
  },
  {
    description: HelpCopy.termsOfUseDescription,
    label: HelpCopy.termsOfUseLabel,
    url: LegalLinks.termsOfUseUrl,
  },
];

export function HelpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SignedInStackParamList>>();

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(HelpCopy.openLinkError);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.description}>{HelpCopy.linkDescription}</Text>
      <View style={styles.linkList}>
        <Pressable
          onPress={() => navigation.navigate("open-source-licenses")}
          style={styles.linkRow}
        >
          <View style={styles.linkTextBlock}>
            <Text style={styles.linkLabel}>{OpenSourceLicensesCopy.screenTitle}</Text>
            <Text style={styles.linkDescription}>{OpenSourceLicensesCopy.helpMenuDescription}</Text>
          </View>
          <Feather color={AppColors.mutedStrongText} name="chevron-right" size={18} />
        </Pressable>
        {HELP_LINK_ITEMS.map((item, index) => (
          <Pressable
            key={item.url}
            onPress={() => void handleOpenLink(item.url)}
            style={[
              styles.linkRow,
              index === HELP_LINK_ITEMS.length - 1 ? styles.lastLinkRow : null,
            ]}
          >
            <View style={styles.linkTextBlock}>
              <Text style={styles.linkLabel}>{item.label}</Text>
              <Text style={styles.linkDescription}>{item.description}</Text>
            </View>
            <Feather color={AppColors.mutedStrongText} name="external-link" size={18} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
  },
  description: {
    ...SupportingTextStyle,
    color: AppColors.mutedStrongText,
  },
  linkList: {
    ...SurfaceCardStyle,
    gap: 0,
    paddingVertical: 0,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AppLayout.cardGap,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  lastLinkRow: {
    borderBottomWidth: 0,
  },
  linkTextBlock: {
    flex: 1,
    gap: 4,
  },
  linkLabel: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  linkDescription: {
    ...SupportingTextStyle,
    color: AppColors.mutedStrongText,
  },
});
