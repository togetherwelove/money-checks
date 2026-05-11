import * as Updates from "expo-updates";

export async function reloadAppAsync(): Promise<boolean> {
  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
