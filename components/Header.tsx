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
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';

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
    marginBottom: spacing.l,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: radius.s,
    ...touchTargets.styles.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPlaceholder: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    ...typography.h4,
  },
  profileButton: {
    padding: spacing.xs,
    borderRadius: radius.l,
    ...touchTargets.styles.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 