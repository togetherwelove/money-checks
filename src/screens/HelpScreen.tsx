import { Feather } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { SupportingTextStyle, SurfaceCardStyle } from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";

type HelpLinkItem = {
  description: string;
  label: string;
  url: string;
};

const HELP_LINK_ITEMS: HelpLinkItem[] = [
  {
    description: "앱에서 사용하는 오픈소스 소프트웨어 고지",
    label: "오픈소스 라이선스",
    url: LegalLinks.openSourceLicensesUrl,
  },
  {
    description: "개인정보 수집, 이용, 보관 및 권리 안내",
    label: "개인정보 처리방침",
    url: LegalLinks.privacyPolicyUrl,
  },
  {
    description: "서비스 이용 조건, 구독 및 책임 범위 안내",
    label: "이용약관",
    url: LegalLinks.termsOfUseUrl,
  },
];

export function HelpScreen() {
  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast("링크를 열지 못했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.description}>필요한 정책 문서를 브라우저에서 확인할 수 있어요.</Text>
      <View style={styles.linkList}>
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
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
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
