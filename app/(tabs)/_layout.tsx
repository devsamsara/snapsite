import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { NativeTabs, Icon, Stack } from "expo-router";
import { Platform } from "react-native";
import { HomeContent } from "./home-content";

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <NativeTabs
      screenOptions={{
        headerShown: false, // Hide default header for NativeTabs
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <NativeTabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Icon name="house.fill" size={size} color={color} />
          ),
        }}
      />
      <NativeTabs.Screen
        name="projects"
        options={{
          title: t("tabs.projects"),
          tabBarIcon: ({ color, size }) => (
            <Icon name="photo.stack.fill" size={size} color={color} />
          ),
        }}
      />
      <NativeTabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <Icon name="person.fill" size={size} color={color} />
          ),
        }}
      />
    </NativeTabs>
  );
}

// Separate Stack for Home screen to enable Large Titles
export function HomeStack() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: Platform.OS === "ios",
        headerTransparent: Platform.OS === "ios",
        headerBlurEffect: Platform.OS === "ios" ? "systemUltraThinMaterial" : undefined,
        headerLargeTitleStyle: {
          color: colors.foreground,
        },
        headerTitleStyle: {
          color: colors.foreground,
        },
        headerTintColor: colors.primary,
        headerStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="home-content" component={HomeContent}
        options={{
          title: t("tabs.home"),
        }}
      />
    </Stack>
  );
}
