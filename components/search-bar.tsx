import { View, TextInput, StyleSheet } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface SearchBarProps {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  editable = true,
}: SearchBarProps) {
  const colors = useColors();

  return (
    <View style={[S.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        style={[S.input, { color: colors.foreground }]}
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    paddingVertical: 0,
  },
});
