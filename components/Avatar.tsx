import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

interface AvatarProps {
  name?: string;
  imageUri?: string;
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  style?: ViewStyle | ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  imageUri,
  size = 'm',
  style,
}) => {
  const getAvatarLetter = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  const getAvatarColor = (text: string) => {
    // Generate a consistent color based on the full text using a hash
    const colors = ['#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#F97316'];
    
    // Create a simple hash from the entire string
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value to ensure positive index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          container: styles.xsContainer,
          text: styles.xsText,
        };
      case 's':
        return {
          container: styles.sContainer,
          text: styles.sText,
        };
      case 'l':
        return {
          container: styles.lContainer,
          text: styles.lText,
        };
      case 'xl':
        return {
          container: styles.xlContainer,
          text: styles.xlText,
        };
      default: // m
        return {
          container: styles.mContainer,
          text: styles.mText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[sizeStyles.container, styles.image, style as ImageStyle]}
      />
    );
  }

  return (
    <View
      style={[
        sizeStyles.container,
        styles.letterContainer,
        { backgroundColor: getAvatarColor(name) },
        style,
      ]}
    >
      <Text style={[sizeStyles.text, styles.letterText]}>
        {getAvatarLetter(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  letterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#f0f0f0',
  },
  letterText: {
    fontWeight: '600',
    color: '#fff',
  },
  // XS size (20x20)
  xsContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  xsText: {
    fontSize: 8,
  },
  // Small size (24x24)
  sContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sText: {
    fontSize: 10,
  },
  // Medium size (32x32)
  mContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  mText: {
    fontSize: 14,
  },
  // Large size (48x48)
  lContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  lText: {
    fontSize: 18,
  },
  // XL size (64x64)
  xlContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  xlText: {
    fontSize: 32,
  },
}); 