import { View, TouchableOpacity, Text, Animated, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import HomeScreen from "./index";
import ProjectsScreen from "./projects";
import CameraScreen from "./camera";
import ProfileScreen from "./profile";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabName = 'home' | 'projects' | 'camera' | 'profile';

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
  { name: 'profile', title: 'Profile', icon: 'person.fill', component: ProfileScreen },
];

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

      {/* Floating Bottom Menu */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
          backgroundColor: colors.surface,
          borderRadius: 24,
          paddingVertical: 12,
          paddingHorizontal: 8,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleTabPress(tab.name)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 16,
                backgroundColor: isActive ? colors.primary + '15' : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                size={24}
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
    </View>
  );
}
