import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/design';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: BorderRadius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    };

    const sizeStyles = {
      sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        minHeight: 36,
      },
      md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        minHeight: 44,
      },
      lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        minHeight: 52,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? Colors.gray300 : Colors.primary,
        ...Shadows.sm,
      },
      secondary: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: disabled ? Colors.gray300 : Colors.border,
      },
      danger: {
        backgroundColor: disabled ? Colors.gray300 : Colors.error,
        ...Shadows.sm,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: Typography.semibold,
      textAlign: 'center' as const,
    };

    const sizeTextStyles = {
      sm: { fontSize: Typography.sm },
      md: { fontSize: Typography.base },
      lg: { fontSize: Typography.lg },
    };

    const variantTextStyles = {
      primary: { color: Colors.white },
      secondary: { color: disabled ? Colors.gray400 : Colors.textPrimary },
      danger: { color: Colors.white },
      ghost: { color: disabled ? Colors.gray400 : Colors.primary },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? Colors.textPrimary : Colors.white}
          style={{ marginRight: Spacing.sm }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  shadow?: keyof typeof Shadows;
}

export function Card({ children, style, padding = 'lg', shadow = 'md' }: CardProps) {
  return (
    <View style={[styles.card, { padding: Spacing[padding] }, Shadows[shadow], style]}>
      {children}
    </View>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ children, variant = 'neutral', size = 'sm', style, textStyle }: BadgeProps) {
  const getBadgeStyle = () => {
    const baseStyle = {
      borderRadius: BorderRadius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    const sizeStyles = {
      sm: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        minHeight: 20,
      },
      md: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        minHeight: 28,
      },
    };

    const variantStyles = {
      success: { backgroundColor: Colors.successLight },
      warning: { backgroundColor: Colors.warningLight },
      error: { backgroundColor: Colors.errorLight },
      info: { backgroundColor: Colors.infoLight },
      neutral: { backgroundColor: Colors.gray100 },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = () => {
    const sizeTextStyles = {
      sm: { fontSize: Typography.xs },
      md: { fontSize: Typography.sm },
    };

    const variantTextStyles = {
      success: { color: Colors.success },
      warning: { color: Colors.warning },
      error: { color: Colors.error },
      info: { color: Colors.info },
      neutral: { color: Colors.textSecondary },
    };

    return {
      fontWeight: Typography.semibold,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
    </View>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({ size = 'large', color = Colors.primary, style }: LoadingSpinnerProps) {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>{icon}</Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
      {action && (
        <Button variant="primary" onPress={action.onPress} style={{ marginTop: Spacing.lg }}>
          {action.label}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyStateDescription: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.normalLineHeight,
  },
});
