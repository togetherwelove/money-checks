export type AppPlatformOs = "ios" | (string & {});

export type AppPlatformConfig = {
  isIOS: boolean;
  os: AppPlatformOs;
};

export function createAppPlatform(os: AppPlatformOs): AppPlatformConfig {
  const isIOS = os === "ios";

  return {
    isIOS,
    os,
  };
}
