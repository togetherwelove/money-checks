import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { WebViewMessageEvent } from "react-native-webview";

import { AppColors } from "../../constants/colors";

const HCAPTCHA_BASE_URL = "https://hcaptcha.com";
const HCAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

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
        if (!HCAPTCHA_SITE_KEY) {
          return Promise.reject(new Error("CAPTCHA 설정이 필요해요. 앱 설정을 확인해 주세요."));
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

      pendingRequest.reject(result.error ?? new Error("CAPTCHA 인증에 실패했어요. 다시 시도해 주세요."));
    };

    const handleCaptchaMessage = (event: CaptchaMessageEvent) => {
      const message = event.nativeEvent.data;

      if (message === "open") {
        return;
      }

      if (event.success && message) {
        captchaRef.current?.hide();
        event.markUsed?.();
        settleCaptchaRequest({ token: message });
        return;
      }

      if (message === "challenge-expired") {
        event.reset();
        return;
      }

      captchaRef.current?.hide();
      settleCaptchaRequest({ error: new Error("CAPTCHA 인증에 실패했어요. 다시 시도해 주세요.") });
    };

    return (
      <ConfirmHcaptcha
        ref={captchaRef}
        backgroundColor={AppColors.background}
        baseUrl={HCAPTCHA_BASE_URL}
        languageCode="ko"
        onMessage={handleCaptchaMessage}
        siteKey={HCAPTCHA_SITE_KEY}
        size="invisible"
        theme="light"
      />
    );
  },
);
