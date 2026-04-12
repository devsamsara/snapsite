// app.config.ts
import "dotenv/config";
import type { ExpoConfig } from "expo/config";

// ─── App identity — set in .env or EAS secrets before publishing ──────────────
// Required for App Store / Play Store:
//   IOS_BUNDLE_ID, ANDROID_PACKAGE, APP_SCHEME
// Optional (have sensible defaults):
//   APP_NAME, APP_SLUG, EAS_PROJECT_ID, EAS_OWNER, GRAPHQL_URL
const APP_NAME        = process.env.APP_NAME        ?? "SnapSite";
const APP_SLUG        = process.env.APP_SLUG        ?? "snapsite-app";
const IOS_BUNDLE_ID   = process.env.IOS_BUNDLE_ID   ?? "com.snapsite.app";
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE ?? "com.snapsite.app";
const APP_SCHEME      = process.env.APP_SCHEME      ?? "snapsite";
const EAS_PROJECT_ID  = process.env.EAS_PROJECT_ID  ?? "c8815663-68f6-4a93-8efb-9f6d40e70767";
const EAS_OWNER       = process.env.EAS_OWNER       ?? "devsamsara";
// GraphQL API endpoint — configure per environment in EAS secrets
const GRAPHQL_URL     = process.env.GRAPHQL_URL     ?? "";

const env = {
    appName: APP_NAME,
    appSlug: APP_SLUG,
    scheme: APP_SCHEME,
    iosBundleId: IOS_BUNDLE_ID,
    androidPackage: ANDROID_PACKAGE,
};

const config: ExpoConfig = {
    name: env.appName,
    slug: env.appSlug,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: env.scheme,
    userInterfaceStyle: "automatic",
    ios: {
        supportsTablet: true,
        bundleIdentifier: env.iosBundleId,
        infoPlist: {
            UIBackgroundModes: ["remote-notification"],
            NSCameraUsageDescription: "SnapSite necesita acceso a tu camara para fotografiar tus proyectos.",
            NSMicrophoneUsageDescription: "SnapSite necesita acceso al microfono para grabar videos.",
            NSPhotoLibraryUsageDescription: "SnapSite necesita acceso a tu galeria para importar fotos.",
            NSPhotoLibraryAddUsageDescription: "SnapSite necesita permiso para guardar fotos en tu galeria.",
            NSLocationWhenInUseUsageDescription: "SnapSite usa tu ubicacion para asociarla a tus proyectos.",
        },
    },
    android: {
        adaptiveIcon: {
            backgroundColor: "#E6F4FE",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            backgroundImage: "./assets/images/android-icon-background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: env.androidPackage,
        permissions: [
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE",
            "READ_MEDIA_IMAGES",
            "READ_MEDIA_VIDEO",
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
        ],
        intentFilters: [
            {
                action: "VIEW",
                autoVerify: true,
                data: [{ scheme: env.scheme, host: "*" }],
                category: ["BROWSABLE", "DEFAULT"],
            },
        ],
    },
    web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png",
    },
    plugins: [
        'expo-media-library',
        'expo-localization',
        [
            "react-native-vision-camera",
            {
                cameraPermissionText: "$(PRODUCT_NAME) necesita acceso a tu cámara",
                enableMicrophonePermission: true,
                microphonePermissionText: "$(PRODUCT_NAME) necesita acceso a tu micrófono",
            },
        ],
        "expo-router",
        [
            "expo-notifications",
            {
                icon: "./assets/images/icon.png",
                color: "#2563EB",
            },
        ],
        [
            "expo-audio",
            {
                microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
            },
        ],
        [
            "expo-video",
            {
                supportsBackgroundPlayback: true,
                supportsPictureInPicture: true,
            },
        ],
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash-icon.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#ffffff",
                dark: {
                    backgroundColor: "#000000",
                },
            },
        ],
        [
            "expo-build-properties",
            {
                ios: {
                    // useFrameworks: "static" is REQUIRED for Skia, VisionCamera,
                    // and other C++ native modules that use CocoaPods frameworks.
                    // Without it, the linker cannot find the C++ symbols at runtime
                    // and the app crashes immediately on launch in production.
                    useFrameworks: "static",
                    deploymentTarget: "15.1",
                    // New Architecture is DISABLED on iOS.
                    // Root cause: EXC_BAD_ACCESS in EXJSIInstaller.mm:84 /
                    // AppContext.swift:458 — the Expo modules host object is
                    // installed into a JSI runtime that has already been
                    // released during bridge initialization on iOS 26 (beta).
                    // This is a known Expo SDK 54 + New Arch + iOS 26 issue.
                    // Re-enable once Expo releases a fix for EXJSIInstaller.
                    // Crash ID: EC5E1665-5108-4C45-BFD2-344332511DCA
                    newArchEnabled: false,
                },
                android: {
                    buildArchs: ["armeabi-v7a", "arm64-v8a"],
                    // Keep New Arch disabled on Android until all native modules
                    // confirm Android Fabric support (VisionCamera 4 is still
                    // experimental on Android New Arch).
                    newArchEnabled: false,
                    minSdkVersion: 24,
                },
            },
        ],
    ],
    extra: {
        graphqlUrl: GRAPHQL_URL,
        eas: {
            projectId: EAS_PROJECT_ID,
        },
    },
    updates: {
        url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
        policy: "appVersion",
    },
    owner: EAS_OWNER,
    experiments: {
        typedRoutes: true,
        // reactCompiler is intentionally DISABLED.
        // The React Compiler transforms component functions before Reanimated/
        // Worklets can annotate worklet closures, causing JSI serialization
        // failures that only manifest in production (release) builds on iOS.
        // Re-enable once react-native-worklets ships compiler-aware transforms.
    },
};

export default config;