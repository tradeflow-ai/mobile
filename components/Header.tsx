import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Avatar } from './Avatar';

interface HeaderProps {
  title: string;
  rightAction?: {
    icon?: keyof typeof FontAwesome.glyphMap;
    text?: string;
    onPress?: () => void;
    disabled?: boolean;
  };
  leftAction?: {
    icon?: keyof typeof FontAwesome.glyphMap;
    text?: string;
    onPress?: () => void;
    disabled?: boolean;
  };
  profile?: {
    imageUrl?: string;
    name?: string;
    onPress?: () => void;
    disabled?: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  rightAction,
  leftAction,
  profile,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const renderActionButton = (action: HeaderProps['rightAction'] | HeaderProps['leftAction']) => {
    if (!action) return <View style={styles.actionPlaceholder} />;

    const { icon, text, onPress, disabled } = action;

    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        {icon && (
          <FontAwesome
            name={icon}
            size={20}
            color={disabled ? colors.placeholder : colors.primary}
          />
        )}
        {text && (
          <Text
            style={[
              styles.actionText,
              {
                color: disabled ? colors.placeholder : colors.primary,
              },
            ]}
          >
            {text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderProfileImage = () => {
    if (!profile) return null;

    const { imageUrl, name, onPress, disabled } = profile;

    return (
      <TouchableOpacity
        style={[
          styles.profileButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Avatar
          name={name}
          imageUri={imageUrl}
          size="m"
          style={disabled ? { opacity: 0.5 } : undefined}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.header}>
      {profile ? renderProfileImage() : renderActionButton(leftAction)}
      
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      
      {renderActionButton(rightAction)}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPlaceholder: {
    width: 40,
    height: 40,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 