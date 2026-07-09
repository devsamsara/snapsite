import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "react-i18next";
import HomeScreen from "./index";
import ProjectsScreen from "./projects";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import SettingsScreen from '@/app/(tabs)/settings';

export default function TabLayout() {
  const { t }  = useTranslation();
  const colors = useColors();
  const isDark = useColorScheme() === "dark";

  const tabs = [
    {
      name: 'index' as const,
      title: t('tabs.home'),
      icon: 'house.fill',
      component: HomeScreen,
    },
    {
      name: 'projects' as const,
      title: t('tabs.projects'),
      icon: 'photo.stack.fill',
      component: ProjectsScreen,
    },
    {
      name: 'settings' as const,
      title: t('tabs.settings'),
      icon: 'gearshape.fill',
      component: SettingsScreen,
    },
  ];

  return (
    <NativeTabs
      // Glassmorphism nativo: blur adaptado al esquema y sin backgroundColor
      // opaco en iOS para que el material translúcido sea visible.
      blurEffect={isDark ? "systemChromeMaterialDark" : "systemChromeMaterial"}
      backgroundColor={Platform.OS === "ios" ? null : colors.surface}
      // Alto contraste: icono/label activos en primary, inactivos en muted.
      tintColor={colors.primary}
      iconColor={{ default: colors.muted, selected: colors.primary }}
      labelStyle={{
        default: { color: colors.muted },
        selected: { color: colors.primary },
      }}
      minimizeBehavior="onScrollDown"
      // Android: feedback de presión e indicador sutiles derivados del acento.
      rippleColor={colors.primary + "22"}
      indicatorColor={colors.primary + "1A"}
    >
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <Label>{tab.title}</Label>
          <Icon sf={tab.icon as any} drawable="ic_menu_mylocation" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
