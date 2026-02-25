// app.config.ts
import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const bundleId = "space.manus.field.cam.app.t20260114190645";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
    appName: "SnapSite",
    appSlug: "snapsite-app",
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
    ios: {
        supportsTablet: true,
        bundleIdentifier: env.iosBundleId,
        deploymentTarget: "15.1", // RN 0.81 requiere mínimo 15.1
        infoPlist: {
            UIBackgroundModes: ["remote-notification"],
            NSCameraUsageDescription: "Necesitamos acceso a tu cámara",
            NSMicrophoneUsageDescription: "Necesitamos acceso a tu micrófono",
            NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería",
            NSPhotoLibraryAddUsageDescription: "Necesitamos permiso para guardar fotos",
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
                    useFrameworks: "static", // CRÍTICO para cassert
                    deploymentTarget: "15.1",
                    newArchEnabled: true,
                },
                android: {
                    buildArchs: ["armeabi-v7a", "arm64-v8a"],
                    newArchEnabled: true,
                    minSdkVersion: 24,
                },
            },
        ],
    ],
    extra: {
        eas: {
            projectId: "c8815663-68f6-4a93-8efb-9f6d40e70767",
        },
    },
    updates: {
        url: "https://u.expo.dev/c8815663-68f6-4a93-8efb-9f6d40e70767",
    },
    runtimeVersion: {
        policy: "appVersion",
    },
    owner: "devsamsara",
    experiments: {
        typedRoutes: true,
        reactCompiler: true, // React 19 soporta el compilador
    },
};

export default config;