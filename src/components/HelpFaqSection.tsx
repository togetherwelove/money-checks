import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getMenuStyles } from "../constants/menuStyles";
import { Feather } from "./AppIcons";

import { AppSettingsUi } from "../constants/appSettings";
import { getAppSettingsRowStyles } from "../constants/appSettingsStyles";
import { getAppColors } from "../constants/colors";
import { HelpCopy, HelpUi } from "../constants/help";
import { HelpFaqGroups } from "../constants/helpFaq";
import { AppLayout } from "../constants/layout";
import { ReadingTextProps } from "../constants/textLayout";
import { getListGroupRowStyle, getSupportingTextStyle } from "../constants/uiStyles";

export function HelpFaqSection() {
  const styles = getStyles();
  useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text {...ReadingTextProps} style={getSupportingTextStyle()}>
        {HelpCopy.faqDescription}
      </Text>
      {HelpFaqGroups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text accessibilityRole="header" style={getMenuStyles().sectionTitle}>
            {group.title}
          </Text>
          <View style={getMenuStyles().group}>
            {group.items.map((item, index) => {
              const expanded = expandedId === item.id;
              return (
                <View
                  key={item.id}
                  collapsable={false}
                  style={index < group.items.length - 1 ? styles.divider : null}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={item.question}
                    onPress={() =>
                      setExpandedId((currentId) => (currentId === item.id ? null : item.id))
                    }
                    style={({ pressed }) => [
                      styles.questionRow,
                      pressed && getAppSettingsRowStyles().pressed,
                    ]}
                  >
                    <Text {...ReadingTextProps} style={styles.question}>
                      {item.question}
                    </Text>
                    <Feather
                      name={expanded ? "chevron-up" : "chevron-down"}
                      color={getAppColors().mutedStrongText}
                      size={HelpUi.iconSize}
                    />
                  </Pressable>
                  {expanded ? (
                    <View style={styles.answer}>
                      <Text {...ReadingTextProps} style={getMenuStyles().body}>
                        {item.answer}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <Text {...ReadingTextProps} style={getSupportingTextStyle()}>
        {HelpCopy.moreHelp}
      </Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    section: { gap: AppSettingsUi.sectionSpacing },
    group: { gap: AppSettingsUi.sectionGap },
    divider: {
      borderBottomWidth: AppLayout.dividerWidth,
      borderBottomColor: getAppColors().border,
    },
    questionRow: { ...getAppSettingsRowStyles().row, ...getAppSettingsRowStyles().lastRow },
    question: { ...getAppSettingsRowStyles().title, flex: 1, minWidth: 0 },
    answer: {
      ...getListGroupRowStyle(),
      ...getAppSettingsRowStyles().lastRow,
      paddingTop: 0,
      paddingHorizontal: getMenuStyles().row.paddingHorizontal,
    },
  }),
);
