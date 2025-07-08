// Simple navigation hook for Expo Router
// This bypasses TypeScript issues with expo-router exports

export const useAppNavigation = () => {
  const navigate = (path: string) => {
    try {
      // @ts-ignore - Bypass TypeScript issues with expo-router
      const expoRouter = require('expo-router');
      
      // Try different possible export patterns
      if (expoRouter.router) {
        expoRouter.router.push(path);
      } else if (expoRouter.default && expoRouter.default.router) {
        expoRouter.default.router.push(path);
      } else {
        console.log(`Navigation would go to: ${path}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      console.log(`Fallback: Would navigate to: ${path}`);
    }
  };

  return { navigate };
}; 