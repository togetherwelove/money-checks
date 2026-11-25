import { Linking, Pressable, Text, View } from "react-native";
import { AllMenuLegalLinks } from "../../constants/allMenu";
import { HelpCopy } from "../../constants/help";
import { getMenuStyles } from "../../constants/menuStyles";
import { useAppTheme } from "../../hooks/useAppTheme";
import { showNativeToast } from "../../lib/nativeToast";

async function openLegalLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    showNativeToast(HelpCopy.linkError);
  }
}

export function MenuLegalLinks() {
  useAppTheme();
  const styles = getMenuStyles();
  return (
    <View style={styles.legalLinks}>
      {AllMenuLegalLinks.map((item) => (
        <Pressable
          key={item.url}
          accessibilityRole="link"
          onPress={() => void openLegalLink(item.url)}
        >
          <Text style={styles.description}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
