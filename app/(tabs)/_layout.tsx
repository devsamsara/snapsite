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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Content Area */}
      <View style={{ flex: 1 }}>
        <ActiveComponent />
      </View>

      {/* Floating Bottom Menu with Glassmorphism */}
      <BlurView
        intensity={colorScheme === 'dark' ? 80 : 60}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 12,
          left: '50%',
          transform: [{ translateX: -((SCREEN_WIDTH * 0.7) / 2) }],
          width: SCREEN_WIDTH * 0.7,
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.2,
          shadowRadius: 12,
          elevation: 10,
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
            paddingVertical: 6,
            paddingHorizontal: 6,
            flexDirection: 'row',
            position: 'relative',
          }}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            setTabWidth((width - 12) / tabs.length);
          }}
        >
          {/* Animated Selector Background with Glassmorphism */}
          {tabWidth > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                left: 6,
                top: 6,
                bottom: 6,
                width: tabWidth,
                borderRadius: 14,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
                transform: [
                  {
                    translateX: selectorAnim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, tabWidth, tabWidth * 2],
                    }),
                  },
                ],
              }}
            >
              <BlurView
                intensity={80}
                tint={colorScheme === 'dark' ? 'prominent' : 'light'}
                style={{
                  flex: 1,
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(37, 99, 235, 0.25)',
                }}
              />
            </Animated.View>
          )}

          {/* Tab Buttons */}
          {tabs.map((tab, index) => {
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
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                  transform: [{ scale: isPressed ? 0.95 : 1 }],
                }}
                activeOpacity={1}
              >
                <IconSymbol
                  size={22}
                  name={tab.icon as any}
                  color={isActive ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? colors.primary : colors.muted,
                    marginTop: 2,
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
