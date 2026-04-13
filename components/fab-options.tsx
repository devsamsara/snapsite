import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { IconSymbol } from './ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

export function FabOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useColors();
  const router = useRouter();
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    animation.value = withSpring(toValue);
    setIsOpen(!isOpen);
  };

  const handleNewProject = () => {
    toggleMenu();
    router.push('/create-project-location');
  };

  // ✅ Cada animated style declarado en el top level
  const fabStyle = useAnimatedStyle(() => {
    const rotation = interpolate(animation.value, [0, 1], [0, 45]);
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  const option0Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(animation.value, [0, 1], [0, -70]) },
      { scale: interpolate(animation.value, [0, 1], [0, 1]) },
    ],
    opacity: interpolate(animation.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  const option1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(animation.value, [0, 1], [0, -140]) },
      { scale: interpolate(animation.value, [0, 1], [0, 1]) },
    ],
    opacity: interpolate(animation.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(animation.value * 0.5),
    pointerEvents: animation.value > 0 ? 'auto' : 'none',
  }));

  return (
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
            style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: '#000' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleMenu} />
        </Animated.View>

        <View style={styles.fabWrapper}>
          <Animated.View style={[styles.optionContainer, option0Style]}>
            <Text style={[styles.optionLabel, { color: '#FFF' }]}>Nuevo Proyecto</Text>
            <TouchableOpacity
                onPress={handleNewProject}
                style={[styles.optionButton, { backgroundColor: colors.primary }]}
            >
              <IconSymbol name="plus.rectangle.on.folder.fill" size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.optionContainer, option1Style]}>
            <Text style={[styles.optionLabel, { color: '#FFF' }]}>Tomar Foto</Text>
            <TouchableOpacity
                onPress={() => { toggleMenu(); router.push('/camera-capture'); }}
                style={[styles.optionButton, { backgroundColor: '#34C759' }]}
            >
              <IconSymbol name="camera.fill" size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleMenu}
              style={[styles.mainFab, { backgroundColor: colors.primary }]}
          >
            <Animated.View style={fabStyle}>
              <IconSymbol name="plus" size={32} color="#FFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    alignItems: 'center',
  },
  mainFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 200,
    right: 0,
  },
  optionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});
