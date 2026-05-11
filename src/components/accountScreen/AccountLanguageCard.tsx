import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppCurrencies, type AppCurrency } from "../../constants/currency";
import { CardTitleTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import { changeAppLanguage } from "../../i18n";
import { type AppLanguage, AppLanguages } from "../../i18n/types";
import { reloadAppAsync } from "../../lib/appReload";
import {
  readStoredCurrency,
  resolveDefaultCurrencyForLanguage,
  resolveDisplayCurrency,
  storeCurrency,
} from "../../lib/currencyPreference";
import {
  fetchOwnProfileDefaultCurrency,
  syncOwnProfileDefaultCurrency,
  syncOwnProfilePreferredLocale,
} from "../../lib/profiles";

const LANGUAGE_LABEL_KEYS: Record<AppLanguage, string> = {
  en: "language.english",
  ko: "language.korean",
};

const CURRENCY_LABEL_KEYS: Record<AppCurrency, string> = {
  KRW: "currency.KRW",
  USD: "currency.USD",
};

type AccountLanguageCardProps = {
  userId: string;
};

export function AccountLanguageCard({ userId }: AccountLanguageCardProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = resolveCurrentLanguage(i18n.language);
  const [selectedCurrency, setSelectedCurrency] = useState(() =>
    resolveDisplayCurrency(currentLanguage),
  );

  useEffect(() => {
    let isMounted = true;

    const loadCurrency = async () => {
      try {
        const profileCurrency = await fetchOwnProfileDefaultCurrency(userId);
        const nextCurrency = profileCurrency ?? readStoredCurrency();
        if (!nextCurrency || !isMounted) {
          return;
        }

        storeCurrency(nextCurrency);
        setSelectedCurrency(nextCurrency);
      } catch (error) {
        console.error("[AccountLanguageCard] Failed to load default currency", error);
      }
    };

    void loadCurrency();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleChangeLanguage = async (language: AppLanguage) => {
    if (language === currentLanguage) {
      return;
    }

    try {
      const nextCurrency = resolveDefaultCurrencyForLanguage(language);
      storeCurrency(nextCurrency);
      setSelectedCurrency(nextCurrency);
      await changeAppLanguage(language);
      await Promise.all([
        syncOwnProfilePreferredLocale(language),
        syncOwnProfileDefaultCurrency(nextCurrency),
      ]);
      const didReload = await reloadAppAsync();
      if (!didReload) {
        Alert.alert(t("screens.languageSettings"), t("language.restartNotice"));
      }
    } catch (error) {
      console.error("[AccountLanguageCard] Failed to change language", error);
    }
  };

  const handleChangeCurrency = async (currency: AppCurrency) => {
    if (currency === selectedCurrency) {
      return;
    }

    try {
      storeCurrency(currency);
      setSelectedCurrency(currency);
      await syncOwnProfileDefaultCurrency(currency);
      const didReload = await reloadAppAsync();
      if (!didReload) {
        Alert.alert(t("screens.languageSettings"), t("language.restartNotice"));
      }
    } catch (error) {
      console.error("[AccountLanguageCard] Failed to change currency", error);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("language.cardTitle")}</Text>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t("language.languageSelectLabel")}</Text>
        <View style={styles.pickerShell}>
          <Picker<AppLanguage>
            selectedValue={currentLanguage}
            onValueChange={(value) => {
              void handleChangeLanguage(value);
            }}
            style={styles.picker}
          >
            {AppLanguages.map((language) => (
              <Picker.Item
                key={language}
                label={t(LANGUAGE_LABEL_KEYS[language])}
                value={language}
              />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t("language.currencySelectLabel")}</Text>
        <View style={styles.pickerShell}>
          <Picker<AppCurrency>
            selectedValue={selectedCurrency}
            onValueChange={(value) => {
              void handleChangeCurrency(value);
            }}
            style={styles.picker}
          >
            {AppCurrencies.map((currency) => (
              <Picker.Item
                key={currency}
                label={t(CURRENCY_LABEL_KEYS[currency])}
                value={currency}
              />
            ))}
          </Picker>
        </View>
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
    gap: 12,
  },
  cardTitle: CardTitleTextStyle,
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  picker: {
    color: AppColors.text,
  },
  pickerShell: {
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
});
