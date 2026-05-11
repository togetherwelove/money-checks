import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { AppColors } from "../../constants/colors";
import { changeAppLanguage } from "../../i18n";
import { type AppLanguage, AppLanguages } from "../../i18n/types";
import { reloadAppAsync } from "../../lib/appReload";

const LANGUAGE_LABEL_KEYS: Record<AppLanguage, string> = {
  en: "language.english",
  ko: "language.korean",
};

export function AuthLanguageSwitch() {
  const { i18n, t } = useTranslation();
  const currentLanguage = resolveCurrentLanguage(i18n.language);
  const nextLanguage = currentLanguage === "ko" ? "en" : "ko";

  const handlePress = async () => {
    try {
      await changeAppLanguage(nextLanguage);
      const didReload = await reloadAppAsync();
      if (!didReload) {
        Alert.alert(t("screens.languageSettings"), t("language.restartNotice"));
      }
    } catch (error) {
      console.error("[AuthLanguageSwitch] Failed to change language", error);
    }
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.button}>
      <Text style={styles.iconText}>A</Text>
      <Text style={styles.label}>{t(LANGUAGE_LABEL_KEYS[currentLanguage])}</Text>
    </Pressable>
  );
}

function resolveCurrentLanguage(language: string): AppLanguage {
  return AppLanguages.find((candidate) => language.startsWith(candidate)) ?? "ko";
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderColor: AppColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  iconText: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  label: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
});
