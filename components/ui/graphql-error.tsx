/**
 * GraphQLError — reusable error state component
 *
 * All colors are resolved at render time from the active theme palette,
 * so the component responds correctly to light / dark mode changes.
 *
 * Usage (minimal — uses all defaults):
 *   if (error) return <GraphQLError />;
 *
 * Usage (with retry callback):
 *   if (error) return <GraphQLError onRetry={() => refetch()} />;
 *
 * Usage (compact variant, e.g. inside a modal body):
 *   if (error) return <GraphQLError variant="compact" onRetry={() => refetch()} />;
 *
 * Usage (inline variant, e.g. inside a list section):
 *   if (error) return <GraphQLError variant="inline" />;
 *
 * Usage (custom message + children):
 *   if (error) return (
 *     <GraphQLError title="Sin datos" message="No pudimos cargar los proyectos." onRetry={() => refetch()}>
 *       <Text>Información adicional</Text>
 *     </GraphQLError>
 *   );
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GraphQLErrorVariant =
  | 'fullscreen'  // centered in the full available space (default)
  | 'compact'     // smaller card, good for modals / sheets
  | 'inline';     // single-row strip, good for sections inside a list

export interface GraphQLErrorProps {
  /** Override the error title. Falls back to i18n key `graphqlError.title`. */
  title?: string;
  /** Override the body message. Falls back to i18n key `graphqlError.message`. */
  message?: string;
  /** Label for the retry button. Falls back to i18n key `graphqlError.retry`. */
  retryLabel?: string;
  /** When provided, a retry button is rendered and this callback is invoked on press. */
  onRetry?: () => void;
  /** Visual variant. Defaults to `'fullscreen'`. */
  variant?: GraphQLErrorVariant;
  /** Extra content rendered below the message (and above the retry button). */
  children?: React.ReactNode;
  /** Additional style applied to the outermost container. */
  style?: object;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphQLError({
  title,
  message,
  retryLabel,
  onRetry,
  variant = 'fullscreen',
  children,
  style,
}: GraphQLErrorProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const resolvedTitle   = title      ?? t('graphqlError.title');
  const resolvedMessage = message    ?? t('graphqlError.message');
  const resolvedRetry   = retryLabel ?? t('graphqlError.retry');

  // Dynamic styles — recalculated only when the active palette changes.
  // This is the correct pattern for theme-aware styles in React Native:
  // StyleSheet.create() is static and cannot reference runtime values.
  const D = useMemo(() => ({
    // ── Fullscreen ──────────────────────────────────────────────────────────
    fullContainer: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 40,
      paddingVertical: 32,
      gap: 12,
      backgroundColor: colors.background,
    },
    iconRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 4,
    },
    iconInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.error + '14',
    },
    fullTitle: {
      fontSize: 17,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      letterSpacing: -0.3,
      color: colors.foreground,
    },
    fullMessage: {
      fontSize: 14,
      textAlign: 'center' as const,
      lineHeight: 20,
      color: colors.muted,
    },
    statusPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 4,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.error,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      color: colors.muted,
    },

    // ── Compact ─────────────────────────────────────────────────────────────
    compactContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: 28,
      margin: 16,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    compactIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 4,
      backgroundColor: colors.error + '14',
    },
    compactTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      letterSpacing: -0.2,
      color: colors.foreground,
    },
    compactMessage: {
      fontSize: 13,
      textAlign: 'center' as const,
      lineHeight: 18,
      color: colors.muted,
    },

    // ── Inline ───────────────────────────────────────────────────────────────
    inlineContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.error + '0D',
      borderColor: colors.error + '33',
    },
    inlineText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 17,
      color: colors.error,
    },
    inlineRetry: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.primary,
    },

    // ── Shared retry button ──────────────────────────────────────────────────
    retryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 4,
      borderColor: colors.border,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }), [colors]);

  // ── Inline variant ──────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <View style={[D.inlineContainer, style]}>
        <MaterialIcons name="error-outline" size={16} color={colors.error} />
        <Text style={D.inlineText} numberOfLines={2}>
          {resolvedMessage}
        </Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} hitSlop={8}>
            <Text style={D.inlineRetry}>{resolvedRetry}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Compact variant (modal / sheet body) ────────────────────────────────────
  if (variant === 'compact') {
    return (
      <View style={[D.compactContainer, style]}>
        <View style={D.compactIconWrap}>
          <MaterialIcons name="wifi-off" size={28} color={colors.error} />
        </View>
        <Text style={D.compactTitle}>{resolvedTitle}</Text>
        <Text style={D.compactMessage}>{resolvedMessage}</Text>
        {children}
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={D.retryButton} activeOpacity={0.7}>
            <MaterialIcons name="refresh" size={15} color={colors.primary} />
            <Text style={D.retryText}>{resolvedRetry}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Fullscreen variant (default) ────────────────────────────────────────────
  return (
    <View style={[D.fullContainer, style]}>
      <View style={D.iconRing}>
        <View style={D.iconInner}>
          <MaterialIcons name="wifi-off" size={36} color={colors.error} />
        </View>
      </View>
      <Text style={D.fullTitle}>{resolvedTitle}</Text>
      <Text style={D.fullMessage}>{resolvedMessage}</Text>
      <View style={D.statusPill}>
        <View style={D.statusDot} />
        <Text style={D.statusText}>{t('graphqlError.status')}</Text>
      </View>
      {children}
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={D.retryButton} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={15} color={colors.primary} />
          <Text style={D.retryText}>{resolvedRetry}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
