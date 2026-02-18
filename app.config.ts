// Load environment variables with proper priority (system > .env)
import "dotenv/config";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
const bundleId = "space.manus.field.cam.app.t20260114190645";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
    // App branding
    appName: "SnapSite",
    appSlug: "snapsite-app",
    // S3 URL of the app logo (empty = use default icon from assets)
    logoUrl: "",
    scheme: schemeFromBundleId,
    iosBundleId: bundleId,
    androidPackage: bundleId,
};

const config: ExpoConfig = {
    name: env.appName,
    slug: env.appSlug,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: env.scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        bundleIdentifier: env.iosBundleId,
        infoPlist: {
            UIBackgroundModes: ["remote-notification"],
            NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar fotos",
            NSCameraUsageDescription: "Necesitamos acceso a tu cámara para tomar fotos",
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
        "permissions": [
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE",
            "READ_MEDIA_IMAGES",
            "READ_MEDIA_VIDEO",
        ],
        intentFilters: [
            {
                action: "VIEW",
                autoVerify: true,
                data: [
                    {
                        scheme: env.scheme,
                        host: "*",
                    },
                ],
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
        [
            "react-native-vision-camera",
            {
                "cameraPermissionText": "$(PRODUCT_NAME) necesita acceso a tu cámara",
                "enableMicrophonePermission": true,
                "microphonePermissionText": "$(PRODUCT_NAME) necesita acceso a tu micrófono"
            }
        ],
        "expo-router", [
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
                android: {
                    buildArchs: ["armeabi-v7a", "arm64-v8a"],
                },
            },
        ],
    ],
    extra: {
        eas: {
            projectId: "c8815663-68f6-4a93-8efb-9f6d40e70767"
        },
        bundleId: env.iosBundleId,
        scheme: env.scheme,
        logoUrl: env.logoUrl,
        // Variables de entorno (si las tienes en .env)
        apiUrl: process.env.EXPO_PUBLIC_API_URL,
        apiKey: process.env.EXPO_PUBLIC_API_KEY,
    },
    updates: {
        url: "https://u.expo.dev/c8815663-68f6-4a93-8efb-9f6d40e70767"
    },
    runtimeVersion: {
        policy: "appVersion"
    },
    owner: "devsamsara",
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
};

export default config;
