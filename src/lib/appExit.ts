import { BackHandler } from "react-native";

import { appPlatform } from "./appPlatform";

export function exitAppIfSupported(): boolean {
  if (!appPlatform.isAndroid) {
    return false;
  }

  BackHandler.exitApp();
  return true;
}
