import { View, TouchableOpacity, Text, Animated, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { BlurView } from "expo-blur";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import HomeScreen from "./index";
import ProjectsScreen from "./projects";
import CameraScreen from "./camera";
import ProfileScreen from "./profile";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabName = 'home' | 'projects' | 'camera';

interface Tab {
  name: TabName;
  title: string;
  icon: string;
  component: React.ComponentType;
}

const tabs: Tab[] = [
  { name: 'home', title: 'Home', icon: 'house.fill', component: HomeScreen },
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

  const activeIndex = tabs.findIndex(tab => tab.name === activeTab);
  const ActiveComponent = tabs[activeIndex].component;

  useEffect(() => {
    // Fade out, then slide and fade in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: activeIndex * SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeTab, activeIndex]);

  const handleTabPress = (tabName: TabName) => {
    if (tabName !== activeTab) {
      setActiveTab(tabName);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Content Area with Fade Animation */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
        }}
      >
        <ActiveComponent />
      </Animated.View>

      {/* Floating Bottom Menu with Glassmorphism */}
      <BlurView
        intensity={colorScheme === 'dark' ? 80 : 60}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.2,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <View
          style={{
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(30, 41, 59, 0.7)' 
              : 'rgba(248, 250, 252, 0.8)',
            borderWidth: 1,
            borderColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
            paddingVertical: 12,
            paddingHorizontal: 8,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            const isPressed = pressedTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                onPressIn={() => setPressedTab(tab.name)}
                onPressOut={() => setPressedTab(null)}
                onPress={() => handleTabPress(tab.name)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 18,
                  backgroundColor: isActive 
                    ? colorScheme === 'dark'
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(37, 99, 235, 0.15)'
                    : isPressed
                    ? colorScheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)'
                    : 'transparent',
                  transform: [{ scale: isPressed ? 0.95 : 1 }],
                }}
                activeOpacity={1}
              >
                <IconSymbol
                  size={26}
                  name={tab.icon as any}
                  color={isActive ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? colors.primary : colors.muted,
                    marginTop: 4,
                  }}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
