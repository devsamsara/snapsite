import "react-native-reanimated";
import "@/global.css";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useEffect, useMemo, useState} from "react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Platform, useColorScheme} from "react-native";
import "@/lib/_core/nativewind-pressable";
import {ThemeProvider} from "@/lib/theme-provider";
import {AuthProvider} from "@/lib/auth-context";
import type {EdgeInsets, Rect} from "react-native-safe-area-context";
import {
    initialWindowMetrics,
    SafeAreaFrameContext,
    SafeAreaInsetsContext,
    SafeAreaProvider,
} from "react-native-safe-area-context";
import {apolloClient} from "@/lib/graphql-client";
import {initI18n} from "@/lib/i18n";
import {ApolloProvider} from "@apollo/client/react";

const DEFAULT_WEB_INSETS: EdgeInsets = {top: 0, right: 0, bottom: 0, left: 0};
const DEFAULT_WEB_FRAME: Rect = {x: 0, y: 0, width: 0, height: 0};

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
    const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

    const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
    const [frame, setFrame] = useState<Rect>(initialFrame);
    const [i18nReady, setI18nReady] = useState(false);

    // Initialize i18n on first mount — must be awaited before rendering any screen
    useEffect(() => {
        initI18n().then(() => setI18nReady(true));
    }, []);

    const colorScheme = useColorScheme();
    // sheetBg opaco: evita ver la pantalla de atrás a través de los bordes
    // redondeados del formSheet en iOS cuando backgroundColor es transparent
    const sheetBg = colorScheme === "dark" ? "#0F172A" : "#F8FAFC";
    // Ensure minimum 8px padding for top and bottom on mobile
    const providerInitialMetrics = useMemo(() => {
        const metrics = initialWindowMetrics ?? {insets: initialInsets, frame: initialFrame};
        return {
            ...metrics,
            insets: {
                ...metrics.insets,
                top: Math.max(metrics.insets.top, 16),
                bottom: Math.max(metrics.insets.bottom, 12),
            },
        };
    }, [initialInsets, initialFrame]);

    // Don't render anything until i18n is ready — prevents key strings showing as raw keys
    if (!i18nReady) return null;

    const content = (
        <GestureHandlerRootView style={{flex: 1}}>
            <ApolloProvider client={apolloClient}>
                <AuthProvider>
                        <Stack screenOptions={{headerShown: false}}>
                            <Stack.Screen
                                name="onboarding"
                                options={{
                                    animation: 'fade',
                                    gestureEnabled: false,
                                }}
                            />
                            <Stack.Screen name="auth/login"/>
                            <Stack.Screen name="auth/register"/>
                            <Stack.Screen name="auth/forgot-password"/>
                            <Stack.Screen name="auth/confirm-email"/>
                            <Stack.Screen
                                name="(tabs)"
                                options={{ animation: 'fade' }}
                            />
                            {/* oauth/callback removed — handled by AuthProvider */}
                            <Stack.Screen
                                name="company-cam-clone"
                                options={{
                                    headerShown: false,
                                    presentation: 'fullScreenModal',
                                    animation: 'slide_from_bottom',
                                }}
                            />
                            <Stack.Screen
                                name="add-photo-modal"
                                options={{
                                    presentation: 'modal',
                                    animation: 'slide_from_bottom'
                                }}
                            />
                            <Stack.Screen
                                name="image-editor"
                                options={{
                                    headerShown: true,
                                    headerStyle: {backgroundColor: "#111"},
                                    headerTintColor: "#FFFFFF",
                                    headerTitleStyle: {fontWeight: "600", fontSize: 17, color: "#FFFFFF"},
                                    headerBackVisible: false,
                                    headerShadowVisible: false,
                                    contentStyle: {backgroundColor: "#000"},
                                }}
                            />
                            {/* ── Modal screens ── */}
                            <Stack.Screen
                                name="modals/privacy-modal"
                                options={{
                                    presentation: "modal",
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},

                                }}
                            />
                            <Stack.Screen
                                name="modals/terms-modal"
                                options={{
                                    presentation: "modal",
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},

                                }}
                            />
                            <Stack.Screen
                                name="modals/annotation-text"
                                options={{
                                    presentation: "formSheet",
                                    // 'large' = ocupa toda la altura disponible en iPhone
                                    // y garantiza ancho completo sin bordes laterales
                                    // [1.0] = altura completa disponible → sin bordes laterales en iPhone
                                    sheetAllowedDetents: [0.65],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/annotation-measure"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: "fitToContents",
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/photo-lightbox"
                                options={{
                                    presentation: "fullScreenModal",
                                    headerShown: false,
                                    animation: "fade",
                                    contentStyle: {backgroundColor: "#000"},
                                }}
                            />
                            <Stack.Screen
                                name="modals/add-note"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.50],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/invite-member"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.70],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/project-settings"
                                options={{
                                    presentation: "modal",
                                    sheetAllowedDetents: [1.0],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="modals/invite-global"
                                options={{
                                    presentation: "modal",
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/team-members"
                                options={{
                                    presentation: "modal",
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="modals/edit-project"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.85],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/project-tags"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.75],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/project-description"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.70],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/project-contacts"
                                options={{
                                    presentation: "modal",
                                    sheetAllowedDetents: [1.0],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="modals/project-export"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.80],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                            <Stack.Screen
                                name="modals/project-share"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.85],
                                    sheetGrabberVisible: true,
                                    headerShown: false,
                                    contentStyle: {backgroundColor: sheetBg},
                                }}
                            />
                        </Stack>
                        <StatusBar style="auto"/>
                </AuthProvider>
            </ApolloProvider>
        </GestureHandlerRootView>
    );

    const shouldOverrideSafeArea = Platform.OS === "web";

    if (shouldOverrideSafeArea) {
        return (
            <ThemeProvider>
                <SafeAreaProvider initialMetrics={providerInitialMetrics}>
                    <SafeAreaFrameContext.Provider value={frame}>
                        <SafeAreaInsetsContext.Provider value={insets}>
                            {content}
                        </SafeAreaInsetsContext.Provider>
                    </SafeAreaFrameContext.Provider>
                </SafeAreaProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
        </ThemeProvider>
    );
}
