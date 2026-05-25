/**
 * GraphQLError — reusable error state component
 *
 * Usage (minimal — uses all defaults):
 *   if (error) return <GraphQLError />;
 *
 * Usage (custom message):
 *   if (error) return <GraphQLError title="Sin datos" message="No pudimos cargar los proyectos." />;
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
 * Usage (with custom children below the message):
 *   if (error) return (
 *     <GraphQLError>
 *       <Text>Información adicional</Text>
 *     </GraphQLError>
 *   );
 */

import React from 'react';
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

  const resolvedTitle   = title       ?? t('graphqlError.title');
  const resolvedMessage = message     ?? t('graphqlError.message');
  const resolvedRetry   = retryLabel  ?? t('graphqlError.retry');

  // ── Inline variant ──────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <View
        style={[
          S.inlineContainer,
          { backgroundColor: colors.error + '12', borderColor: colors.error + '30' },
          style,
        ]}
      >
        <MaterialIcons name="error-outline" size={16} color={colors.error} />
        <Text style={[S.inlineText, { color: colors.error }]} numberOfLines={2}>
          {resolvedMessage}
        </Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} hitSlop={8}>
            <Text style={[S.inlineRetry, { color: colors.primary }]}>
              {resolvedRetry}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Compact variant (modal / sheet body) ────────────────────────────────────
  if (variant === 'compact') {
    return (
      <View
        style={[
          S.compactContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
      >
        {/* Icon */}
        <View style={[S.compactIconWrap, { backgroundColor: colors.error + '12' }]}>
          <MaterialIcons name="wifi-off" size={28} color={colors.error} />
        </View>

        {/* Text */}
        <Text style={[S.compactTitle, { color: colors.foreground }]}>
          {resolvedTitle}
        </Text>
        <Text style={[S.compactMessage, { color: colors.muted }]}>
          {resolvedMessage}
        </Text>

        {/* Children */}
        {children}

        {/* Retry */}
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={[S.retryButton, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={15} color={colors.primary} />
            <Text style={[S.retryText, { color: colors.primary }]}>
              {resolvedRetry}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Fullscreen variant (default) ────────────────────────────────────────────
  return (
    <View style={[S.fullContainer, style]}>
      {/* Icon ring */}
      <View style={[S.iconRing, { borderColor: colors.border }]}>
        <View style={[S.iconInner, { backgroundColor: colors.error + '10' }]}>
          <MaterialIcons name="wifi-off" size={36} color={colors.error} />
        </View>
      </View>

      {/* Text */}
      <Text style={[S.fullTitle, { color: colors.foreground }]}>
        {resolvedTitle}
      </Text>
      <Text style={[S.fullMessage, { color: colors.muted }]}>
        {resolvedMessage}
      </Text>

      {/* Status pill */}
      <View style={[S.statusPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[S.statusDot, { backgroundColor: colors.error }]} />
        <Text style={[S.statusText, { color: colors.muted }]}>
          {t('graphqlError.status')}
        </Text>
      </View>

      {/* Children */}
      {children}

      {/* Retry */}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[S.retryButton, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="refresh" size={15} color={colors.primary} />
          <Text style={[S.retryText, { color: colors.primary }]}>
            {resolvedRetry}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Fullscreen
  fullContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
    gap: 12,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  fullMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Compact
  compactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    margin: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  compactIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  compactMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Inline
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
  },
  inlineRetry: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Shared retry button
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
