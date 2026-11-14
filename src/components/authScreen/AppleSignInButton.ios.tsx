import { FixedColors } from "../../constants/fixedColors";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { SymbolView } from "expo-symbols";

import { AuthControls } from "../../constants/authControls";
import { ProviderSignInButton } from "./ProviderSignInButton";

export function AppleSignInButton({ onPress }: { onPress: () => void | Promise<void> }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AppleAuthentication.isAvailableAsync()
      .then((value) => {
        if (mounted) setAvailable(value);
      })
      .catch(() => {
        if (mounted) setAvailable(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!available) return null;
  return (
    <ProviderSignInButton
      dark
      label="Apple로 로그인"
      onPress={onPress}
      icon={
        <SymbolView
          name={AuthControls.appleLogoSymbol}
          tintColor={FixedColors.white}
          size={AuthControls.providerIconSize}
          resizeMode="scaleAspectFit"
          style={{ width: AuthControls.providerIconSize, height: AuthControls.providerIconSize }}
        />
      }
    />
  );
}
