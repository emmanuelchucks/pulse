import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = globalThis.process?.env ?? {};
  const base = config as ExpoConfig;

  const iosBundleIdentifier = env.IOS_BUNDLE_IDENTIFIER;
  const androidPackage = env.ANDROID_PACKAGE;
  const appleTeamId = env.APPLE_TEAM_ID;
  const expoOwner = env.EXPO_OWNER;
  const easProjectId = env.EAS_PROJECT_ID;

  return {
    ...base,
    ios: {
      ...base.ios,
      ...(iosBundleIdentifier ? { bundleIdentifier: iosBundleIdentifier } : {}),
      ...(appleTeamId ? { appleTeamId } : {}),
    },
    android: {
      ...base.android,
      ...(androidPackage ? { package: androidPackage } : {}),
    },
    extra: {
      ...base.extra,
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
    ...(expoOwner ? { owner: expoOwner } : {}),
  };
};
