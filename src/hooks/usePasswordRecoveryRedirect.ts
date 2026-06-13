import { useEffect } from "react";
import { Linking } from "react-native";

import {
  completePasswordRecoveryRedirect,
  isPasswordRecoveryRedirectUrl,
} from "../lib/auth/passwordReset";

type UsePasswordRecoveryRedirectOptions = {
  onRecoverySession: () => void;
};

export function usePasswordRecoveryRedirect({
  onRecoverySession,
}: UsePasswordRecoveryRedirectOptions): void {
  useEffect(() => {
    const handlePasswordRecoveryRedirect = async (redirectUrl: string | null) => {
      if (!redirectUrl || !isPasswordRecoveryRedirectUrl(redirectUrl)) {
        return;
      }

      await completePasswordRecoveryRedirect(redirectUrl);
      onRecoverySession();
    };

    void Linking.getInitialURL().then(handlePasswordRecoveryRedirect);
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      void handlePasswordRecoveryRedirect(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  }, [onRecoverySession]);
}
