# TradeFlow - Job & Route Management App

A React Native/Expo job management and route planning app with comprehensive GPS tracking and interactive mapping capabilities.

## Features

- **Job Management**: View, manage, and track different types of jobs (delivery, pickup, service, inspection)
- **Interactive Map**: Real-time map view with job locations, routing, and navigation
- **Route Planning**: Optimized route planning with multiple job stops
- **GPS Tracking**: Real-time location tracking and navigation
- **Priority System**: High, medium, and low priority job classification
- **Profile Management**: User profiles with statistics and settings

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your platform:
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Development Mode

### Start Development Server

For both Expo Go and simulators, start the development server:
```bash
npm start
```

### Run the App

#### Expo Go (Physical Device)
1. Install Expo Go on your mobile device:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. Scan the QR code with:
   - iOS: Camera app or Expo Go app

#### Simulators/Emulators
After starting the development server (`npm start`), you can:

- **iOS Simulator** (macOS only): Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal  
- **Web Browser**: Press `w` in the terminal

#### Development Build (iOS)
To run in development mode with native code:
```bash
npx expo run:ios
```

### Development Features

- **Hot Reload**: Changes are automatically reflected in the app
- **Error Overlay**: Development errors are displayed in the app
- **Metro Bundler**: Fast JavaScript bundling and serving
- **Cross-Platform**: Same codebase runs on iOS, Android, and web

## Documentation

For detailed technical information, architecture, and implementation details, see [TECH_STACK.md](./TECH_STACK.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both iOS and web
5. Submit a pull request

## License

This project is licensed under the MIT License. 