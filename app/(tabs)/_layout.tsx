import { View, TouchableOpacity, Text, Animated, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { BlurView } from "expo-blur";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import HomeScreen from "./index";
import ProjectsScreen from "./projects";
import ProfileScreen from "./profile";
import CameraScreen from "@/app/(tabs)/camera";
import {NativeTabs, Label, Icon} from "expo-router/unstable-native-tabs";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabName = 'home' | 'projects' | 'camera';

interface Tab {
  name: TabName;
  title: string;
  icon: string;
  component: React.ComponentType;
}

const tabs: Tab[] = [
  { name: 'index', title: 'Home', icon: 'house.fill', component: HomeScreen },
  { name: 'projects', title: 'Projects', icon: 'photo.stack.fill', component: ProjectsScreen },
  { name: 'camera', title: 'Camera', icon: 'camera.fill', component: CameraScreen },
];

// Keep profile component for direct navigation
const profileComponent = ProfileScreen;

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [pressedTab, setPressedTab] = useState<TabName | null>(null);
  const selectorAnim = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  const activeIndex = tabs.findIndex(tab => tab.name === activeTab);
  const ActiveComponent = tabs[activeIndex].component;

  useEffect(() => {
    // Animate selector position only
    Animated.spring(selectorAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  }, [activeTab, activeIndex]);

  const handleTabPress = (tabName: TabName) => {
    if (tabName !== activeTab) {
      setActiveTab(tabName);
    }
  };

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
                      name={tab.name}
                      options={{
                          selectedIconColor: colors.primary,
                          iconColor: colors.primary,
                          indicatorColor: colors.primary,
                          shadowColor: colors.primary,
                      }}
                  >
                      <Label>{tab.title}</Label>
                      <Icon sf={tab.icon} drawable="ic_menu_mylocation " />
                  </NativeTabs.Trigger>
              );
          })}
      </NativeTabs>
  );
}
