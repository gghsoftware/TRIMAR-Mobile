import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/design';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helper,
  required,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getInputContainerStyle = () => {
    const baseStyle = {
      borderWidth: 1,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.white,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.md,
      minHeight: 48,
    };

    if (error) {
      return {
        ...baseStyle,
        borderColor: Colors.error,
        backgroundColor: Colors.errorLight,
      };
    }

    if (isFocused) {
      return {
        ...baseStyle,
        borderColor: Colors.primary,
        borderWidth: 2,
      };
    }

    return {
      ...baseStyle,
      borderColor: Colors.border,
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            inputStyle,
            style,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.textTertiary}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}

interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
}

export function SearchInput({ onSearch, onClear, ...props }: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch?.(query);
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  return (
    <Input
      {...props}
      value={query}
      onChangeText={setQuery}
      placeholder="Search..."
      leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
      rightIcon={
        query ? (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        )
      }
      onSubmitEditing={handleSearch}
      returnKeyType="search"
    />
  );
}

interface DateInputProps extends Omit<InputProps, 'onChangeText'> {
  value?: string;
  onDateChange?: (date: string) => void;
  placeholder?: string;
}

export function DateInput({ value, onDateChange, placeholder = 'YYYY-MM-DD', ...props }: DateInputProps) {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDatePress = () => {
    // In a real app, you'd open a date picker here
    // For now, we'll just set today's date
    const today = formatDate(new Date());
    onDateChange?.(today);
  };

  return (
    <Input
      {...props}
      value={value}
      placeholder={placeholder}
      editable={false}
      rightIcon={
        <TouchableOpacity onPress={handleDatePress}>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: Spacing.sm,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  calendarIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
