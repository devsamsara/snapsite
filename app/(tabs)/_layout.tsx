import {  Animated, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import HomeScreen from "./index";
import ProjectsScreen from "./projects";
import ProfileScreen from "./profile";
import {NativeTabs, Label, Icon} from "expo-router/unstable-native-tabs";

type TabName = 'home' | 'projects' | 'camera'| 'index';

interface Tab {
  name: TabName;
  title: string;
  icon: string;
  component: React.ComponentType;
}

const tabs: Tab[] = [
  { name: 'index', title: 'Home', icon: 'house.fill', component: HomeScreen },
  { name: 'projects', title: 'Projects', icon: 'photo.stack.fill', component: ProjectsScreen },
  // { name: 'camera', title: 'Camera', icon: 'camera.fill', component: CameraScreen },
];

export default function TabLayout() {
  const colors = useColors();

  return (
      <NativeTabs
          iconColor={colors.primary}
          blurEffect="systemChromeMaterialDark"
          indicatorColor={colors.primary}
          minimizeBehavior="onScrollUp"
          tintColor={colors.primary}
          shadowColor={colors.primary}
          rippleColor={colors.primary}
          backgroundColor={colors.primary}
      >
          {tabs.map((tab, index) => {
              return (
                  <NativeTabs.Trigger
                      key={tab.name}
                      name={tab.name}
                      options={{
                          selectedIconColor: colors.primary,
                          iconColor: colors.primary,
                          indicatorColor: colors.primary,
                          shadowColor: colors.primary,
                      }}
                  >
                      <Label>{tab.title}</Label>
                      <Icon sf={tab.icon as any} drawable="ic_menu_mylocation " />
                  </NativeTabs.Trigger>
              );
          })}
      </NativeTabs>
  );
}
