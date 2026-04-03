import React, {useState} from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import {IconSymbol} from './icon-symbol';
import {useColors} from '@/hooks/use-colors';
import {Control, FieldValues, Path, useController} from 'react-hook-form';

interface AppInputProps<T extends FieldValues> extends TextInputProps {
    label?: string;
    name: Path<T>;
    control: Control<T>;
    icon?: string;
    secureTextEntry?: boolean;
    error?: string;
    style?: StyleProp<ViewStyle> & StyleProp<TextStyle>;
    showLength?: boolean
}

export function AppInput<T extends FieldValues>({
                                                    label,
                                                    name,
                                                    control,
                                                    icon,
                                                    secureTextEntry,
                                                    error,
                                                    style,
                                                    showLength,
                                                    ...props
                                                }: AppInputProps<T>) {
    const colors = useColors();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const {maxLength, value: val} = props
    const {
        field: {onChange, onBlur, value},
        fieldState: {error: fieldError},
    } = useController({
        name,
        control,
    });

    const displayError = error || fieldError?.message;
    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, {color: colors.foreground}]}>{label}</Text>}

            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: colors.surface,
                        borderColor: displayError ? '#FF3B30' : isFocused ? colors.primary : colors.border,
                        borderWidth: isFocused || displayError ? 2 : 1
                    },
                    style
                ]}
            >
                {icon && (
                    <View style={styles.iconContainer}>
                        <IconSymbol name={icon as any} size={20} color={isFocused ? colors.primary : colors.muted}/>
                    </View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        {color: colors.foreground},
                        style
                    ]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={isSecure}
                    placeholderTextColor={colors.muted}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeButton}
                    >
                        <IconSymbol
                            name={isPasswordVisible ? "eye.slash.fill" : "eye.fill"}
                            size={20}
                            color={colors.muted}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {displayError && (
                <Text style={styles.errorText}>{displayError}</Text>
            )}
            {showLength && <Text style={[styles.counter, {color: colors.muted}]}>{val!.length}/{maxLength}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 12,
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
    eyeButton: {
        padding: 8,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    counter: {
        fontSize: 11, textAlign: "right",
        marginTop: 6,
    }
});
