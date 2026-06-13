import { Platform } from "react-native";

import { createAppPlatform } from "./appPlatformConfig";

export const appPlatform = createAppPlatform(Platform.OS);
