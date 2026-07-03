/**
 * GalleryPhotoSkeleton
 * Muestra un grid de tarjetas skeleton con shimmer animado,
 * con las mismas dimensiones que el grid de fotos del proyecto.
 * Se usa mientras photos === undefined (query cargando) o
 * mientras las imágenes reales aún no han terminado de cargar.
 */
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';

const { width: W } = Dimensions.get('window');
const ITEM_W = (W - 40) / 2; // igual que el grid real: paddingHorizontal 16 × 2 + gap 8

interface Props {
  /** Número de tarjetas skeleton a mostrar. Por defecto 6. */
  count?: number;
}

export function GalleryPhotoSkeleton({ count = 6 }: Props) {
  const colors = useColors();

  const opacity = useSharedValue(0.4);
  opacity.value = withRepeat(
    withSequence(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.sin) }),
    ),
    -1,
    false,
  );
  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[S.grid, shimmer]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            S.card,
            {
              width: ITEM_W,
              backgroundColor: colors.border,
            },
          ]}
        >
          {/* Imagen placeholder */}
          <View style={[S.imgPlaceholder, { backgroundColor: colors.border }]} />
          {/* Overlay inferior con líneas de texto */}
          <View style={[S.overlay, { backgroundColor: colors.surface + 'CC' }]}>
            <View style={[S.line, { width: '70%', backgroundColor: colors.muted + '60' }]} />
            <View style={[S.line, { width: '45%', backgroundColor: colors.muted + '40', marginTop: 4 }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const S = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 150,
  },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  line: {
    height: 10,
    borderRadius: 5,
  },
});
