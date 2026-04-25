import { useEffect } from "react";
import { Linking } from "react-native";

import {
  completeGoogleSignInRedirect,
  isGoogleSignInRedirectUrl,
} from "../lib/auth/googleSignIn";

export function useGoogleAuthRedirectCompletion() {
  useEffect(() => {
    let isMounted = true;

    const handleGoogleRedirect = async (redirectUrl: string) => {
      if (!isGoogleSignInRedirectUrl(redirectUrl)) {
        return;
      }

      try {
        await completeGoogleSignInRedirect(redirectUrl);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("[GoogleAuthRedirect] Failed to complete sign-in redirect", error);
      }
    };

    void Linking.getInitialURL().then((initialUrl) => {
      if (!initialUrl) {
        return;
      }

      void handleGoogleRedirect(initialUrl);
    });

    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      void handleGoogleRedirect(url);
    });

    return () => {
      isMounted = false;
      linkingSubscription.remove();
    };
  }, []);
}
