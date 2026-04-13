module.exports = function (api) {
  api.cache(true);

  // ─── Reanimated 4.x + New Architecture setup ────────────────────────────────────────
  //
  // HOW THIS WORKS WITH REANIMATED 4.x:
  //
  // 1. babel-preset-expo detects react-native-worklets in node_modules and
  //    automatically loads react-native-worklets/plugin (the Reanimated 4 worklets
  //    transform). We let it do this automatically (no worklets:false override).
  //    In Reanimated 4, react-native-reanimated/plugin is just a re-export of
  //    react-native-worklets/plugin, so only one plugin instance runs.
  //
  // 2. nativewind/babel (= react-native-css-interop/babel) also tries to add
  //    react-native-worklets/plugin. We bypass this by NOT using nativewind/babel
  //    and instead directly requiring only the css-interop babel plugin.
  //    The JSX transform (importSource: nativewind) is handled by
  //    babel-preset-expo via { jsxImportSource: 'nativewind' }.
  //
  // 3. react-native-worklets/plugin is appended automatically by babel-preset-expo
  //    and MUST run last. Do NOT add it manually here to avoid double execution.
  //
  // NOTE: Previous config had worklets:false + reanimated:false + manual
  //   "react-native-reanimated/plugin" — that was correct for Reanimated 3.x
  //   (Old Arch). With Reanimated 4.x (New Arch), the worklets plugin must
  //   run via babel-preset-expo's auto-detection.

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // worklets and reanimated auto-detection is ENABLED (default).
          // babel-preset-expo will add react-native-worklets/plugin automatically
          // when it finds react-native-worklets in node_modules (Reanimated 4.x).
        },
      ],
    ],
    plugins: [
      // css-interop babel plugin (what nativewind/babel uses internally).
      // Used directly to avoid the duplicate worklets/plugin that nativewind/babel adds.
      require("react-native-css-interop/dist/babel-plugin").default,
      // react-native-worklets/plugin is added automatically by babel-preset-expo.
      // DO NOT add it here manually to avoid running the worklets transform twice.
    ],
  };
};