const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

let config = getDefaultConfig(__dirname);

if (!config.resolver.sourceExts.includes("sql")) {
  config.resolver.sourceExts.push("sql");
}

config = wrapWithReanimatedMetroConfig(config);

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/theme.css",
  dtsFile: "./src/uniwind.d.ts",
});
