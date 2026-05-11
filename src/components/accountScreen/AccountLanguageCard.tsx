import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { CommonActionCopy } from "../../constants/commonActions";
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

type SelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

const COMPACT_SELECT_ICON_SIZE = 15;
const COMPACT_SELECT_MIN_WIDTH = 132;
const COMPACT_SELECT_PADDING_HORIZONTAL = 12;
const COMPACT_SELECT_PADDING_VERTICAL = 8;
const COMPACT_FIELD_GAP = 10;
const COMPACT_FIELD_LABEL_FONT_SIZE = 14;
const COMPACT_FIELD_LABEL_LINE_HEIGHT = 18;

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
      await syncProfilePreferencesBestEffort([
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
      await syncProfilePreferencesBestEffort([syncOwnProfileDefaultCurrency(currency)]);
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
      <CompactSelectField
        label={t("language.languageSelectLabel")}
        onSelect={(value) => {
          void handleChangeLanguage(value);
        }}
        options={AppLanguages.map((language) => ({
          label: t(LANGUAGE_LABEL_KEYS[language]),
          value: language,
        }))}
        title={t("language.languageSelectLabel")}
        value={currentLanguage}
      />
      <CompactSelectField
        label={t("language.currencySelectLabel")}
        onSelect={(value) => {
          void handleChangeCurrency(value);
        }}
        options={AppCurrencies.map((currency) => ({
          label: t(CURRENCY_LABEL_KEYS[currency]),
          value: currency,
        }))}
        title={t("language.currencySelectLabel")}
        value={selectedCurrency}
      />
    </View>
  );
}

async function syncProfilePreferencesBestEffort(tasks: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[AccountLanguageCard] Failed to sync profile preference", result.reason);
    }
  }
}

function CompactSelectField<TValue extends string>({
  label,
  onSelect,
  options,
  title,
  value,
}: {
  label: string;
  onSelect: (value: TValue) => void;
  options: SelectOption<TValue>[];
  title: string;
  value: TValue;
}) {
  const selectedOption = options.find((option) => option.value === value);

  const handlePress = () => {
    Alert.alert(
      title,
      undefined,
      [
        ...options.map((option) => ({
          onPress: () => onSelect(option.value),
          text: option.label,
        })),
        {
          style: "cancel" as const,
          text: CommonActionCopy.cancel,
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={handlePress} style={styles.selectButton}>
        <Text numberOfLines={1} style={styles.selectButtonText}>
          {selectedOption?.label ?? value}
        </Text>
        <Feather color={AppColors.mutedText} name="chevron-down" size={COMPACT_SELECT_ICON_SIZE} />
      </Pressable>
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
  field: {
    alignItems: "center",
    flexDirection: "row",
    gap: COMPACT_FIELD_GAP,
    justifyContent: "space-between",
  },
  fieldLabel: {
    color: AppColors.text,
    flexShrink: 0,
    fontSize: COMPACT_FIELD_LABEL_FONT_SIZE,
    fontWeight: "800",
    lineHeight: COMPACT_FIELD_LABEL_LINE_HEIGHT,
  },
  selectButton: {
    alignItems: "center",
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    minWidth: COMPACT_SELECT_MIN_WIDTH,
    paddingHorizontal: COMPACT_SELECT_PADDING_HORIZONTAL,
    paddingVertical: COMPACT_SELECT_PADDING_VERTICAL,
  },
  selectButtonText: {
    color: AppColors.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
  },
});
