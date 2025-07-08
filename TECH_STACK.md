# Tech Stack Documentation

## Overview
This job and route management app is built using React Native with Expo, designed for iOS and web platforms with comprehensive GPS tracking, interactive mapping, and route planning capabilities.

---

## 🏗️ **Core Framework**

### **React Native**
- **Purpose**: Cross-platform mobile development framework
- **Why Chosen**: Enables code sharing between iOS and web platforms
- **Key Features**: Native performance, hot reloading, extensive ecosystem

### **Expo**
- **Purpose**: Development platform and build toolchain
- **Why Chosen**: Simplified development workflow, managed builds, OTA updates
- **Key Features**: Expo Go for testing, managed workflow, extensive APIs

---

## 🧭 **Navigation & Routing**

### **Expo Router**
- **Purpose**: File-based routing system
- **Implementation**: Tab navigation with modal support
- **Features**: Type-safe navigation, automatic deep linking, web support

### **React Navigation**
- **Purpose**: Navigation library (dependency of Expo Router)
- **Features**: Stack, tab, and modal navigation patterns

---

## 🎨 **UI & Styling**

### **React Native Core Components**
- **SafeAreaView**: Handles device safe areas (notches, status bars)
- **StyleSheet**: Optimized styling system
- **TouchableOpacity**: Interactive elements
- **FlatList**: Performant list rendering

### **Custom UI Components**
- **Button**: Multiple variants (primary, secondary, outline, ghost)
- **TextInput**: Form inputs with validation and error states
- **Card**: Consistent container styling with shadows
- **StatusBadge**: Color-coded status indicators
- **Header**: Reusable header component with actions

### **Color System**
- **Primary Green**: `#2E8B57` (Sea Green)
- **Light Green**: `#98FB98` (Pale Green)
- **Dark Green**: `#006400` (Dark Green)
- **Accent Green**: `#32CD32` (Lime Green)
- **Dynamic theming**: Light/dark mode support

---

## 🎯 **State Management**

### **Jotai**
- **Purpose**: Atomic state management
- **Why Chosen**: Lightweight, TypeScript-first, excellent performance
- **Implementation**: Comprehensive atoms for jobs, location, routes, and user data
- **Benefits**: No providers needed, easy testing, granular updates

### **Key Atoms**
- **jobLocationsAtom**: Array of job locations with types and priorities
- **currentLocationAtom**: Real-time user GPS location
- **selectedJobLocationAtom**: Currently selected job for details
- **inventoryItemsAtom**: Inventory items management
- **routesAtom**: Route planning and tracking data

### **React Hooks**
- **useState**: Local component state
- **useEffect**: Side effects and lifecycle management
- **Custom hooks**: Color scheme detection, navigation helpers

---

## 🗺️ **Location & Mapping** (Fully Implemented)

### **Expo Location**
- **Purpose**: GPS tracking and location services
- **Features**: Current location, location watching, geocoding, reverse geocoding
- **Implementation**: LocationService class with singleton pattern
- **Capabilities**: Distance calculation, permission handling, location tracking

### **React Native Maps**
- **Purpose**: Interactive map components
- **Features**: Markers, polylines, route visualization, user location
- **Implementation**: Full integration with job markers, route planning
- **Native Integration**: iOS Maps and Google Maps support

### **Map Features**
- **Job Markers**: Color-coded by job type and priority
- **Route Visualization**: Polyline routes between multiple job locations
- **Real-time Location**: User location tracking and updates
- **Native Navigation**: Deep link to platform-specific map apps

---

## 🔐 **Backend & Database** (Configured)

### **Supabase**
- **Purpose**: Backend-as-a-Service
- **Features**: Authentication, real-time database, edge functions
- **Implementation**: Client configured, service classes implemented
- **Benefits**: Real-time sync, row-level security, PostgreSQL
- **Services**: AuthService and InventoryService classes

---

## 🛠️ **Development Tools**

### **TypeScript**
- **Purpose**: Type safety and developer experience
- **Configuration**: Strict mode enabled, path mapping configured
- **Benefits**: Better IDE support, fewer runtime errors, self-documenting code

### **Metro Bundler**
- **Purpose**: JavaScript bundler optimized for React Native
- **Features**: Fast refresh, tree shaking, asset resolution

### **Expo CLI**
- **Purpose**: Development and build toolchain
- **Features**: Development server, building, publishing

---

## 📦 **Key Dependencies**

### **Production Dependencies**
```json
{
  "@expo/vector-icons": "^14.1.0",        // Icon library
  "@supabase/supabase-js": "^2.50.3",     // Backend client
  "expo": "~53.0.17",                      // Expo SDK
  "expo-constants": "^17.1.7",            // App constants
  "expo-font": "~13.3.2",                 // Font loading
  "expo-location": "^18.1.6",             // GPS services
  "expo-router": "~5.1.3",                // File-based routing
  "expo-splash-screen": "~0.30.10",       // Splash screen
  "expo-status-bar": "~2.2.3",            // Status bar control
  "expo-maps": "~0.11.0",                 // Expo Maps integration
  "jotai": "^2.12.5",                     // State management
  "react": "19.0.0",                       // React library
  "react-dom": "19.0.0",                  // Web support
  "react-native": "0.79.5",               // Core framework
  "react-native-maps": "1.20.1",          // Map components
  "react-native-reanimated": "~3.17.4",   // Animations
  "react-native-safe-area-context": "5.4.0", // Safe area handling
  "react-native-screens": "~4.11.1",      // Native screens
  "react-native-uuid": "^2.0.3",          // UUID generation
  "react-native-web": "~0.20.0"           // Web compatibility
}
```

### **Development Dependencies**
```json
{
  "@babel/core": "^7.25.2",               // JavaScript compiler
  "@types/react": "~19.0.10",             // React TypeScript types
  "typescript": "~5.8.3"                  // TypeScript compiler
}
```

---

## 🏗️ **Project Architecture**

### **File Structure**
```
├── app/                     # Expo Router pages
│   ├── (tabs)/             # Tab navigation screens
│   │   ├── index.tsx       # Job/inventory listing screen
│   │   ├── map.tsx         # Interactive map with job locations
│   │   └── _layout.tsx     # Tab layout
│   ├── modal.tsx           # Add/Edit item modal with validation
│   ├── profile.tsx         # User profile with statistics
│   └── _layout.tsx         # Root layout
├── components/             # Reusable components
│   ├── ui/                # UI component library
│   │   ├── Button.tsx     # Multi-variant custom button
│   │   ├── Card.tsx       # Card container
│   │   ├── StatusBadge.tsx # Status indicators
│   │   └── TextInput.tsx  # Form inputs with validation
│   ├── Header.tsx         # Reusable header component
│   └── useColorScheme.ts  # Theme hook
├── constants/             # App constants
│   └── Colors.ts          # Color theme system
├── services/              # External services
│   ├── location.ts        # LocationService with GPS tracking
│   └── supabase.ts        # Backend service with auth
├── store/                 # State management
│   └── atoms.ts           # Jotai atoms for jobs, location, routes
├── utils/                 # Utility functions
│   └── mapUtils.ts        # Map utilities and native integration
└── assets/                # Static assets
```

### **Design Patterns**
- **Atomic Design**: Component hierarchy (atoms → molecules → organisms)
- **Singleton Pattern**: LocationService for GPS management
- **Service Layer**: Separation of business logic from UI
- **Custom Hooks**: Reusable stateful logic
- **Compound Components**: Complex UI patterns

---

## 🚀 **Performance Optimizations**

### **React Native Optimizations**
- **FlatList**: Virtualized lists for large datasets
- **SafeAreaView**: Optimized safe area handling
- **StyleSheet.create()**: Cached styles for better performance

### **State Management**
- **Jotai**: Atomic updates prevent unnecessary re-renders
- **Derived atoms**: Computed values cached automatically
- **Granular subscriptions**: Components only re-render when needed

### **Map Performance**
- **Marker clustering**: Efficient rendering of multiple job locations
- **Route optimization**: Optimized polyline rendering
- **Location throttling**: Efficient GPS updates

### **Bundle Optimization**
- **Metro tree shaking**: Removes unused code
- **Asset optimization**: Optimized image loading
- **Code splitting**: Lazy loading where applicable

---

## 📱 **Job Management Features**

### **Job Types**
- **Delivery**: Package and equipment delivery jobs
- **Pickup**: Equipment pickup and retrieval jobs
- **Service**: Maintenance and service call jobs
- **Inspection**: Safety and compliance inspection jobs

### **Priority System**
- **High Priority**: Red markers, urgent jobs
- **Medium Priority**: Standard color coding
- **Low Priority**: Lower visual prominence

### **Route Planning**
- **Multi-stop routing**: Optimized route through multiple job locations
- **Native maps integration**: Deep linking to iOS Maps/Google Maps
- **Real-time navigation**: GPS-based route following

---

## 🔮 **Future Enhancements**

### **Planned Features**
- **Real-time synchronization** with Supabase
- **Offline support** with local storage
- **Push notifications** for job alerts and updates
- **Camera integration** for job completion photos
- **Barcode scanning** for quick item identification
- **Advanced filtering** and search capabilities
- **Analytics dashboard** with performance insights
- **Team collaboration** features

### **Technology Additions**
- **React Query**: Server state management
- **Flipper**: Advanced debugging
- **Detox**: E2E testing framework
- **React Native Image Picker**: Photo capture
- **React Native Vision Camera**: Advanced camera features
- **React Native Push Notifications**: Job alerts

---

## 📱 **Platform Support**

### **Current Platforms**
- ✅ **iOS**: Full native support with SafeAreaView and native maps
- ✅ **Web**: React Native Web compatibility
- 🚧 **Android**: Ready (not currently tested)

### **Device Support**
- **iOS 11+**: SafeAreaView support
- **Modern devices**: iPhone 13+ notch support
- **Web browsers**: Modern browser compatibility

---

## 🛡️ **Security & Best Practices**

### **Security Measures**
- **Environment variables**: Sensitive data in expo-constants
- **Type safety**: TypeScript prevents runtime errors
- **Input validation**: Form validation and sanitization
- **Safe area handling**: Prevents UI overlap issues
- **Location permissions**: Proper GPS permission handling

### **Code Quality**
- **TypeScript strict mode**: Enhanced type checking
- **Component isolation**: Reusable, testable components
- **Error boundaries**: Graceful error handling
- **Consistent styling**: Centralized color system

---

## 📊 **Development Workflow**

### **Development Commands**
```bash
npm start          # Start development server
npm run ios        # Run on iOS simulator
npm run web        # Run on web browser
npm run android    # Run on Android emulator
```

### **Build Process**
- **Development**: Expo Go for rapid testing
- **Production**: EAS Build for distribution
- **Web**: Static build for web deployment

This tech stack provides a robust foundation for a scalable, maintainable job and route management application with comprehensive mapping capabilities and room for future growth and feature additions. 