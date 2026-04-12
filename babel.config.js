module.exports = function (api) {
  api.cache(true);

  // ─── Reanimated 3.x + Old Architecture setup ────────────────────────────────
  //
  // WHY this config is structured this way:
  //
  // 1. babel-preset-expo auto-detects react-native-worklets in node_modules and
  //    loads react-native-worklets/plugin. We pass { worklets: false } to disable
  //    that auto-detection, then manually add react-native-reanimated/plugin.
  //
  // 2. nativewind/babel → react-native-css-interop/babel.js hardcodes
  //    "react-native-worklets/plugin" in its plugins array (for Reanimated 4).
  //    We bypass this by NOT using the nativewind/babel preset and instead
  //    directly requiring only the css-interop babel plugin we actually need.
  //    The JSX transform (importSource: nativewind) is already handled by
  //    babel-preset-expo via { jsxImportSource: 'nativewind' }.
  //
  // 3. react-native-reanimated/plugin MUST be the last plugin in the list.
  //    Reanimated 3.x bundles its own worklets transform inside this plugin.

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Disable auto-loading of react-native-worklets/plugin (Reanimated 4 only)
          worklets: false,
          // Disable auto-loading of react-native-reanimated/plugin (we add it manually below)
          reanimated: false,
        },
      ],
    ],
    plugins: [
      // css-interop babel plugin (what nativewind/babel uses internally, without worklets)
      require("react-native-css-interop/dist/babel-plugin").default,
      // Reanimated 3.x plugin — MUST be last
      "react-native-reanimated/plugin",
    ],
  };
};
