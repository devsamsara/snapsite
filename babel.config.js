module.exports = function (api) {
  api.cache(true);

  // IMPORTANT: react-native-reanimated/plugin MUST be the last plugin in the list.
  // Reanimated 3.x bundles its own worklets transform inside this plugin.
  // Do NOT add react-native-worklets/plugin separately (that was only needed for Reanimated 4.x).
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
