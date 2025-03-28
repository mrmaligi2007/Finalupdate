import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  View, 
  StyleProp, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { spacing, borderRadius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  
  // Create dynamic styles based on theme
  const dynamicStyles = {
    solid: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    solidDisabled: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.surfaceVariant,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
    },
    outlineDisabled: {
      borderColor: colors.text.disabled,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    solidText: {
      color: colors.text.inverse,
    },
    outlineText: {
      color: colors.primary,
    },
    ghostText: {
      color: colors.primary,
    },
    disabledText: {
      color: colors.text.disabled,
    },
  };

  const buttonStyles = [
    styles.button,
    styles[size],
    variant === 'solid' && [styles.solid, dynamicStyles.solid],
    variant === 'outline' && [styles.outline, dynamicStyles.outline],
    variant === 'ghost' && [styles.ghost, dynamicStyles.ghost],
    fullWidth && styles.fullWidth,
    disabled && [
      styles.disabled,
      variant === 'solid' && dynamicStyles.solidDisabled,
      variant === 'outline' && dynamicStyles.outlineDisabled,
    ],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    variant === 'solid' && dynamicStyles.solidText,
    variant === 'outline' && dynamicStyles.outlineText,
    variant === 'ghost' && dynamicStyles.ghostText,
    disabled && dynamicStyles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.inverse} />;
    }

    const iconElement = icon && (
      <View style={[styles.iconContainer, iconPosition === 'right' && styles.iconRight]}>
        {icon}
      </View>
    );

    return (
      <>
        {iconPosition === 'left' && iconElement}
        <Text style={textStyles}>{title}</Text>
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyles}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  solid: {
    // Colors are applied dynamically
  },
  outline: {
    // Colors are applied dynamically
  },
  ghost: {
    // Colors are applied dynamically
  },
  disabled: {
    // Colors are applied dynamically
  },
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '500',
    fontSize: 16,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: spacing.xs,
  },
});

// Add default export for expo-router compatibility
export default Button;
