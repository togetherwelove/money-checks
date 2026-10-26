import { Feather } from "./AppIcons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppSettingsUi } from "../constants/appSettings";
import { AppSettingsRowStyles } from "../constants/appSettingsStyles";
import { HelpCopy, HelpUi } from "../constants/help";
import { HelpFaqGroups } from "../constants/helpFaq";
import { AppLayout } from "../constants/layout";
import { ReadingTextProps } from "../constants/textLayout";
import { CardTitleTextStyle, ListGroupRowStyle, ListGroupStyle, SupportingTextStyle } from "../constants/uiStyles";

export function HelpFaqSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text {...ReadingTextProps} style={SupportingTextStyle}>{HelpCopy.faqDescription}</Text>
      {HelpFaqGroups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text accessibilityRole="header" style={CardTitleTextStyle}>{group.title}</Text>
          <View style={ListGroupStyle}>
            {group.items.map((item, index) => {
              const expanded = expandedId === item.id;
              return (
                <View key={item.id} collapsable={false}
                  style={index < group.items.length - 1 ? styles.divider : null}>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
                    accessibilityLabel={item.question}
                    onPress={() => setExpandedId((currentId) => currentId === item.id ? null : item.id)}
                    style={({ pressed }) => [styles.questionRow, pressed && AppSettingsRowStyles.pressed]}>
                    <Text {...ReadingTextProps} style={styles.question}>{item.question}</Text>
                    <Feather name={expanded ? "chevron-up" : "chevron-down"}
                      color={AppColors.mutedStrongText} size={HelpUi.iconSize} />
                  </Pressable>
                  {expanded ? (
                    <View style={styles.answer}>
                      <Text {...ReadingTextProps} style={SupportingTextStyle}>{item.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <Text {...ReadingTextProps} style={SupportingTextStyle}>{HelpCopy.moreHelp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: AppSettingsUi.sectionSpacing },
  group: { gap: AppSettingsUi.sectionGap },
  divider: { borderBottomWidth: AppLayout.dividerWidth, borderBottomColor: AppColors.border },
  questionRow: { ...AppSettingsRowStyles.row, ...AppSettingsRowStyles.lastRow },
  question: { ...AppSettingsRowStyles.title, flex: 1, minWidth: 0 },
  answer: { ...ListGroupRowStyle, ...AppSettingsRowStyles.lastRow, paddingTop: 0 },
});
