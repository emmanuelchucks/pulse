import { getDefaultConfig } from "expo/metro-config";
import { withNativewind } from "nativewind/metro";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(rootDir);

config = withNativewind(config, {
  inlineVariables: false,
});

const sourceExts = [.../** @type {string[]} */ (config.resolver.sourceExts)];
if (!sourceExts.includes("sql")) {
  sourceExts.push("sql");
}

config = {
  ...config,
  resolver: {
    ...config.resolver,
    sourceExts,
  },
};

export default config;
