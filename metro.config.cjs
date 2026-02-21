const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = withNativewind(getDefaultConfig(__dirname), {
  inlineVariables: false,
});

if (!config.resolver.sourceExts.includes("sql")) {
  config.resolver.sourceExts.push("sql");
}

module.exports = config;
