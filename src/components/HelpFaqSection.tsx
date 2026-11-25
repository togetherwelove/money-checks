import { SettingsGroup } from "./appSettings/SettingsGroup";
import { getSettingsGroupStyles } from "../constants/settingsGroupStyles";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getMenuStyles } from "../constants/menuStyles";
import { Feather } from "./AppIcons";

import { getAppSettingsRowStyles } from "../constants/appSettingsStyles";
import { getAppColors } from "../constants/colors";
import { HelpCopy, HelpUi } from "../constants/help";
import { HelpFaqGroups } from "../constants/helpFaq";
import { ReadingTextProps } from "../constants/textLayout";
import { getSupportingTextStyle } from "../constants/uiStyles";

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
        <SettingsGroup key={group.id}>
          {group.items.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <View key={item.id} collapsable={false}>
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
        </SettingsGroup>
      ))}
      <Text {...ReadingTextProps} style={getSupportingTextStyle()}>
        {HelpCopy.moreHelp}
      </Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    section: getSettingsGroupStyles().sections,
    questionRow: getSettingsGroupStyles().row,
    question: { ...getSettingsGroupStyles().label, flex: 1, minWidth: 0 },
    answer: { ...getSettingsGroupStyles().body, paddingTop: 0 },
  }),
);
