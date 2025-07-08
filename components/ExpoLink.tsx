import React from 'react';
import { TouchableOpacity } from 'react-native';

interface ExpoLinkProps {
  href: string;
  children: React.ReactNode;
  asChild?: boolean;
  style?: any;
  onPress?: () => void;
}

export const ExpoLink: React.FC<ExpoLinkProps> = ({ 
  href, 
  children, 
  asChild = false, 
  style,
  onPress 
}) => {
  const handlePress = () => {
    try {
      // @ts-ignore - Bypass TypeScript issues with expo-router
      const expoRouter = require('expo-router');
      
      // Try different possible export patterns
      if (expoRouter.router) {
        expoRouter.router.push(href);
      } else if (expoRouter.default && expoRouter.default.router) {
        expoRouter.default.router.push(href);
      } else {
        console.log(`Would navigate to: ${href}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      console.log(`Fallback: Would navigate to: ${href}`);
    }
    
    // Call additional onPress if provided
    if (onPress) {
      onPress();
    }
  };

  if (asChild && React.isValidElement(children)) {
    // Clone the child element and add the onPress handler
    return React.cloneElement(children as React.ReactElement<any>, { 
      onPress: handlePress 
    });
  }

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      {children}
    </TouchableOpacity>
  );
}; 