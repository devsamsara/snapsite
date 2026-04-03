/**
 * modals/photo-lightbox.tsx
 *
 * Stack.Screen modal fullscreen — visualizar una foto del proyecto con
 * sus metadatos y acceso al editor de anotaciones.
 *
 * Params recibidos:
 *   - url: string
 *   - caption: string
 *   - date: string
 *   - tags: string  (JSON array)
 *   - projectId: string
 */

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

const { width: W, height: H } = Dimensions.get("window");

export default function PhotoLightboxModal() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const params  = useLocalSearchParams<{
    url: string; caption: string; date: string; tags: string; projectId: string;
  }>();

  const tags: string[] = (() => {
    try { return JSON.parse(params.tags ?? "[]"); } catch { return []; }
  })();

  const handleAnnotate = () => {
    router.replace({
      pathname: "/image-editor",
      params: { imageUri: params.url, projectId: params.projectId },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {/* Close button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialIcons name="close" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Photo */}
      <Image
        source={{ uri: params.url }}
        style={styles.photo}
        resizeMode="contain"
      />

      {/* Metadata */}
      <ScrollView
        style={styles.meta}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
      >
        <Text style={styles.caption}>{params.caption}</Text>
        <View style={styles.dateRow}>
          <MaterialIcons name="access-time" size={13} color="rgba(255,255,255,0.5)" />
          <Text style={styles.date}>{params.date}</Text>
        </View>

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagTxt}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Annotate button */}
        <TouchableOpacity onPress={handleAnnotate} style={styles.annotateBtn}>
          <MaterialIcons name="edit" size={18} color="#FFF" />
          <Text style={styles.annotateTxt}>Anotar Foto</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: "absolute", right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  photo: { width: W, height: W * 0.75, marginTop: 60 },
  meta: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  caption: { color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 14 },
  date: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tag: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  tagTxt: { color: "#FFF", fontSize: 13, fontWeight: "500" },
  annotateBtn: {
    backgroundColor: "#007AFF", paddingVertical: 15, borderRadius: 14,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
  },
  annotateTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
