import path from "node:path";

import { loadProjectEnv } from "@expo/env";
import type { ExpoConfig } from "expo/config";

import easProject from "../eas-project.json";

loadProjectEnv(path.resolve(__dirname, ".."), { silent: true });

const config: ExpoConfig = {
  name: "알뜰 비밀번호 재설정",
  slug: "money-checks",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: easProject.projectId,
    },
  },
  web: {
    bundler: "metro",
    output: "static",
  },
};

export default config;
