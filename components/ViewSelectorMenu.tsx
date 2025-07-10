import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { spacing, typography, radius, shadows, touchTargets } from '@/constants/Theme';
import { CalendarView } from '@/components/Calendar';

interface ViewSelectorMenuProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ViewSelectorMenu: React.FC<ViewSelectorMenuProps> = ({
  currentView,
  onViewChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const viewOptions: { value: CalendarView; label: string; icon: string }[] = [
    { value: 'day', label: 'Day View', icon: 'calendar' },
    { value: 'agenda', label: 'Agenda View', icon: 'list' },
    { value: 'month', label: 'Month View', icon: 'th' },
  ];

  const handleViewSelect = (view: CalendarView) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.menuTrigger,
          {
            ...touchTargets.styles.minimum,
            ...spacing.helpers.paddingHorizontal('s'),
            justifyContent: 'center',
          }
        ]}
        onPress={() => setIsMenuOpen(true)}
      >
        <FontAwesome name="ellipsis-v" size={20} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={styles.menuContainer}>
            <View style={[
              styles.menu,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.subtle(colorScheme)
            ]}>
              {/* View Options */}
              {viewOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.menuItem,
                    currentView === option.value && [
                      styles.activeMenuItem,
                      { backgroundColor: colors.primary }
                    ],
                    index === viewOptions.length - 1 && styles.lastMenuItem,
                  ]}
                  onPress={() => handleViewSelect(option.value)}
                >
                  <FontAwesome
                    name={option.icon as any}
                    size={16}
                    color={
                      currentView === option.value ? colors.card : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      {
                        color: currentView === option.value ? colors.card : colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {currentView === option.value && (
                    <FontAwesome
                      name="check"
                      size={16}
                      color={colors.card}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuTrigger: {
    // Style handled by touchTargets and spacing
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 80, // Position below header
    marginRight: spacing.m,
  },
  menu: {
    minWidth: 200,
    borderRadius: radius.m,
    borderWidth: 1,
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    borderBottomWidth: 1,
    ...touchTargets.styles.minimum,
  },
  activeMenuItem: {
    // backgroundColor set dynamically
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    ...typography.body,
    marginLeft: spacing.m,
    flex: 1,
  },
  checkIcon: {
    marginLeft: spacing.s,
  },
}); 