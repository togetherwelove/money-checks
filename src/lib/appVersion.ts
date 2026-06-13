import Constants from "expo-constants";

export function getAppVersionLabel(): string {
  return (
    Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? "0.0.0"
  );
}
