import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useColors } from '@/hooks/use-colors';

interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  onSearch?: (text: string) => void;
  onClear?: () => void;
  /** Estilo del contenedor (View), no del TextInput interno. */
  style?: StyleProp<ViewStyle>;
}

export function SearchInput({
  onSearch,
  onClear,
  style,
  value,
  onChangeText,
  ...props
}: SearchInputProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    if (onChangeText) onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          // Ancho constante: el foco solo cambia el color del borde.
          borderColor: isFocused ? colors.primary : colors.border,
        },
        style
      ]}
    >
      <View style={styles.iconContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={isFocused ? colors.primary : colors.muted} />
      </View>

      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={(text) => {
          if (onChangeText) onChangeText(text);
          if (onSearch) onSearch(text);
        }}
        value={value}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        {...props}
      />

      {value && value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 12,
    width: '100%',
    borderWidth: 1.5,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    textAlignVertical: 'center',
  },
  clearButton: {
    padding: 4,
  },
});
