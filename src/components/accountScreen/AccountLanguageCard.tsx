import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { CardTitleTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import { changeAppLanguage } from "../../i18n";
import { type AppLanguage, AppLanguages } from "../../i18n/types";
import { exitAppIfSupported } from "../../lib/appExit";
import { syncOwnProfilePreferredLocale } from "../../lib/profiles";

const LANGUAGE_LABEL_KEYS: Record<AppLanguage, string> = {
  en: "language.english",
  ko: "language.korean",
};

export function AccountLanguageCard() {
  const { i18n, t } = useTranslation();
  const currentLanguage = resolveCurrentLanguage(i18n.language);
  const handleChangeLanguage = async (language: AppLanguage) => {
    if (language === currentLanguage) {
      return;
    }

    try {
      await changeAppLanguage(language);
      await syncOwnProfilePreferredLocale(language);
      if (!exitAppIfSupported()) {
        Alert.alert(t("screens.languageSettings"), t("language.restartNotice"));
      }
    } catch (error) {
      console.error("[AccountLanguageCard] Failed to change language", error);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("screens.languageSettings")}</Text>
      <View style={styles.languageSelector}>
        {AppLanguages.map((language) => {
          const isSelected = language === currentLanguage;

          return (
            <Pressable
              accessibilityRole="button"
              key={language}
              onPress={() => {
                void handleChangeLanguage(language);
              }}
              style={[styles.languageOption, isSelected ? styles.selectedLanguageOption : null]}
            >
              <Text
                style={[styles.languageOptionText, isSelected ? styles.selectedOptionText : null]}
              >
                {t(LANGUAGE_LABEL_KEYS[language])}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function resolveCurrentLanguage(language: string): AppLanguage {
  return AppLanguages.find((candidate) => language.startsWith(candidate)) ?? "ko";
}

const styles = StyleSheet.create({
  card: {
    ...SurfaceCardStyle,
    gap: 8,
  },
  cardTitle: CardTitleTextStyle,
  languageSelector: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    overflow: "hidden",
  },
  languageOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  selectedLanguageOption: {
    backgroundColor: AppColors.primary,
  },
  languageOptionText: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectedOptionText: {
    color: AppColors.inverseText,
  },
});
