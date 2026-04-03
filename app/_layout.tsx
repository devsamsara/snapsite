import "@/global.css";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useCallback, useEffect, useMemo, useState} from "react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import "react-native-reanimated";
import {Platform} from "react-native";
import "@/lib/_core/nativewind-pressable";
import {ThemeProvider} from "@/lib/theme-provider";
import {AuthProvider} from "@/lib/auth-context";
import type {EdgeInsets, Metrics, Rect} from "react-native-safe-area-context";
import {
    initialWindowMetrics,
    SafeAreaFrameContext,
    SafeAreaInsetsContext,
    SafeAreaProvider,
} from "react-native-safe-area-context";

import {createTRPCClient, trpc} from "@/lib/trpc";
import {initManusRuntime, subscribeSafeAreaInsets} from "@/lib/_core/manus-runtime";

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

    // Initialize Manus runtime for cookie injection from parent container
    useEffect(() => {
        initManusRuntime();
    }, []);

    const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
        setInsets(metrics.insets);
        setFrame(metrics.frame);
    }, []);

    useEffect(() => {
        if (Platform.OS !== "web") return;
        const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
        return () => unsubscribe();
    }, [handleSafeAreaUpdate]);

    // Create clients once and reuse them
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Disable automatic refetching on window focus for mobile
                        refetchOnWindowFocus: false,
                        // Retry failed requests once
                        retry: 1,
                    },
                },
            }),
    );
    const [trpcClient] = useState(() => createTRPCClient());

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

    const content = (
        <GestureHandlerRootView style={{flex: 1}}>
            <trpc.Provider client={trpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <Stack screenOptions={{headerShown: false}}>
                            <Stack.Screen name="auth/login"/>
                            <Stack.Screen name="auth/register"/>
                            <Stack.Screen name="auth/forgot-password"/>
                            <Stack.Screen name="auth/confirm-email"/>
                            <Stack.Screen name="(tabs)"/>
                            <Stack.Screen name="oauth/callback"/>
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
                                name="modals/annotation-text"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: [0.70],
                                    headerShown: false,
                                    contentStyle: {backgroundColor: "transparent"},
                                }}
                            />
                            <Stack.Screen
                                name="modals/annotation-measure"
                                options={{
                                    presentation: "formSheet",
                                    headerShown: false,
                                    contentStyle: {backgroundColor: "transparent"},
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
                                    sheetAllowedDetents: [ 0.45],
                                    headerShown: false,


                                }}
                            />
                        </Stack>
                        <StatusBar style="auto"/></AuthProvider>
                </QueryClientProvider>
            </trpc.Provider>
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
