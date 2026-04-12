module.exports = function (api) {
  api.cache(true);

  // IMPORTANT: react-native-worklets/plugin MUST be the ONLY worklet-related
  // Babel plugin. Since Reanimated 4, the Reanimated Babel plugin is bundled
  // inside react-native-worklets/plugin. Adding react-native-reanimated/plugin
  // separately causes double-transform crashes in production on iOS.
  const plugins = ["react-native-worklets/plugin"];

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
