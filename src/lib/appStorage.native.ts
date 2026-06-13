import "expo-sqlite/localStorage/install";

import type { AppStorage } from "./appStorage.shared";

export const appStorage = localStorage as AppStorage;
