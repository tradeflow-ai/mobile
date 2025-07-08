import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Avatar } from './Avatar';
import { userProfileAtom } from '@/store/atoms';
import { ProfileManager } from '@/services/profileManager';
import { useAppNavigation } from '@/hooks/useNavigation';

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
}

export const Header: React.FC<HeaderProps> = ({
  title,
  rightAction,
  leftAction,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { navigate } = useAppNavigation();
  
  // Get profile data directly from ProfileManager
  const [userProfile] = useAtom(userProfileAtom);
  const profileManager = ProfileManager.getInstance();
  const displayName = profileManager.getDisplayName();
  
  const handleProfilePress = () => {
    navigate('/profile');
  };

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
    return (
      <TouchableOpacity
        style={styles.profileButton}
        onPress={handleProfilePress}
      >
        <Avatar
          name={displayName}
          imageUri={userProfile?.avatar_url}
          size="m"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.header}>
      {renderProfileImage()}
      
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