import { useClipboardExpansionAnimation } from "../hooks/useClipboardExpansionAnimation";
import { ClipboardPromptUi } from "../constants/cardSmsClipboard";
import { useEffect, useState } from "react";
import { Animated, Keyboard, Platform, Pressable, StyleSheet } from "react-native";
import { AppColors } from "../constants/colors";
import { FloatingEntryButtonUi as Ui } from "../constants/menu";
import { AppMessages } from "../constants/messages";
import { Feather } from "./AppIcons";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

const supportsGlass = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
const hitSlop = (Ui.touchSize - Ui.size) / 2;

export function FloatingEntryButton({ bottomInset, disabled, expanded = false, onPress }: {
  bottomInset: number;
  disabled: boolean;
  expanded?: boolean;
  onPress: () => void;
}) {
  const expansion = useClipboardExpansionAnimation(expanded);
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible || bottomInset <= 0) return null;
  return <Animated.View pointerEvents={expanded ? "none" : "box-none"}
    accessibilityElementsHidden={expanded} importantForAccessibility={expanded ? "no-hide-descendants" : "auto"}
    style={[styles.position, { bottom: bottomInset + Ui.footerGap,
      opacity: expansion.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ scale: expansion.interpolate({ inputRange: [0, 1], outputRange: [1, ClipboardPromptUi.buttonCollapsedScale] }) }],
    }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={AppMessages.entryScreenTitle}
      accessibilityState={{ disabled }} disabled={disabled}
      hitSlop={hitSlop}
      onPress={() => { if (!disabled) onPress(); }}
      style={({ pressed }) => [styles.button,
        supportsGlass && styles.glassButton, pressed && styles.pressed, disabled && styles.disabled]}>
      {supportsGlass ? <GlassView pointerEvents="none" glassEffectStyle="regular" isInteractive
        tintColor={AppColors.primary} colorScheme="light" style={styles.glass} /> : null}
      <Feather name="plus" size={Ui.iconSize} color={AppColors.inverseText} />
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  position: { position: "absolute", right: Ui.rightInset },
  button: {
    width: Ui.size, height: Ui.size, borderRadius: Ui.size / 2,
    backgroundColor: AppColors.primary, alignItems: "center", justifyContent: "center",
    shadowColor: AppColors.text, shadowOffset: { width: 0, height: Ui.shadowOffsetY },
    shadowOpacity: Ui.shadowOpacity, shadowRadius: Ui.shadowRadius, elevation: Ui.elevation,
  },
  glassButton: { backgroundColor: AppColors.transparent, shadowOpacity: 0, elevation: 0 },
  glass: { ...StyleSheet.absoluteFill, borderRadius: Ui.size / 2 },
  pressed: { opacity: Ui.pressedOpacity },
  disabled: { opacity: Ui.disabledOpacity },
});
