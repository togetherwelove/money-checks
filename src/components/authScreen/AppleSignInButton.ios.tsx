import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { AuthControls } from "../../constants/authControls";

export function AppleSignInButton({ onPress }: { onPress: () => void | Promise<void> }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AppleAuthentication.isAvailableAsync()
      .then((value) => { if (mounted) setAvailable(value); })
      .catch(() => { if (mounted) setAvailable(false); });
    return () => { mounted = false; };
  }, []);

  if (!available) return null;
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={AuthControls.borderRadius}
      onPress={() => { void onPress(); }}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: { width: "100%", height: AuthControls.appleButtonHeight },
});
