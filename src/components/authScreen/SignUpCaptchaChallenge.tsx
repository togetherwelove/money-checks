import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { WebViewMessageEvent } from "react-native-webview";

import {
  AuthCaptchaConfig,
  AuthCaptchaEvents,
  AuthCaptchaMessages,
} from "../../constants/authCaptcha";
import { AppColors } from "../../constants/colors";
import { resolveStaticCopyLanguage } from "../../i18n/staticCopy";

export type SignUpCaptchaChallengeHandle = {
  requestToken: () => Promise<string>;
};

type CaptchaMessageEvent = WebViewMessageEvent & {
  markUsed?: () => void;
  reset: () => void;
  success: boolean;
};

type PendingCaptchaRequest = {
  reject: (error: Error) => void;
  resolve: (token: string) => void;
};

export const SignUpCaptchaChallenge = forwardRef<SignUpCaptchaChallengeHandle>(
  function SignUpCaptchaChallenge(_, ref) {
    const captchaRef = useRef<ConfirmHcaptcha>(null);
    const pendingRequestRef = useRef<PendingCaptchaRequest | null>(null);

    useImperativeHandle(ref, () => ({
      requestToken: () => {
        if (!AuthCaptchaConfig.hcaptchaSiteKey) {
          return Promise.reject(new Error(AuthCaptchaMessages.configMissing));
        }

        return new Promise<string>((resolve, reject) => {
          pendingRequestRef.current = { reject, resolve };
          captchaRef.current?.show();
        });
      },
    }));

    const settleCaptchaRequest = (result: { error?: Error; token?: string }) => {
      const pendingRequest = pendingRequestRef.current;
      pendingRequestRef.current = null;

      if (!pendingRequest) {
        return;
      }

      if (result.token) {
        pendingRequest.resolve(result.token);
        return;
      }

      pendingRequest.reject(result.error ?? new Error(AuthCaptchaMessages.verificationFailed));
    };

    const handleCaptchaMessage = (event: CaptchaMessageEvent) => {
      const message = event.nativeEvent.data;

      if (message === AuthCaptchaEvents.open) {
        return;
      }

      if (event.success && message) {
        captchaRef.current?.hide();
        event.markUsed?.();
        settleCaptchaRequest({ token: message });
        return;
      }

      if (message === AuthCaptchaEvents.challengeExpired) {
        event.reset();
        return;
      }

      captchaRef.current?.hide();
      settleCaptchaRequest({ error: new Error(AuthCaptchaMessages.verificationFailed) });
    };

    return (
      <ConfirmHcaptcha
        ref={captchaRef}
        backgroundColor={AppColors.background}
        baseUrl={AuthCaptchaConfig.hcaptchaBaseUrl}
        languageCode={resolveStaticCopyLanguage()}
        onMessage={handleCaptchaMessage}
        siteKey={AuthCaptchaConfig.hcaptchaSiteKey}
        size="invisible"
        theme="light"
      />
    );
  },
);
