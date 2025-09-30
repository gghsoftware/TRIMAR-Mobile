# TRIMAR - Barbershop Mobile App

A modern, feature-rich mobile application for barbershop management, built with React Native and Expo. The app provides a seamless experience for both customers and administrators with booking management, AR hairstyle try-on, and comprehensive admin dashboard.

## 🚀 Features

### 👥 User Features
- **User Authentication**: Secure login/registration with Firebase Auth
- **Booking Management**: Create, view, and manage appointments
- **AR Hairstyle Try-on**: Virtual hairstyle preview using AR technology
- **Profile Management**: Update personal information and preferences
- **Onboarding Experience**: Interactive introduction for new users

### 🔧 Admin Features
- **Dashboard Analytics**: Comprehensive sales and booking statistics
- **Booking Approval**: Approve or reject customer bookings
- **Advanced Filtering**: Filter bookings by date, status, service, and stylist
- **Revenue Tracking**: Visual charts and reports for business insights
- **User Management**: Monitor customer activity and preferences

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with dark theme
- **Responsive Charts**: Interactive data visualization
- **Smooth Animations**: Enhanced user experience with haptic feedback
- **Cross-Platform**: Works on iOS, Android, and Web

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **UI Components**: Custom design system
- **Charts**: React Native SVG
- **AR Integration**: WebView with AR capabilities
- **State Management**: React Context API
- **TypeScript**: Full type safety

## 📱 Screenshots

The app includes:
- Welcome/Onboarding screens
- Login/Registration
- Home dashboard with bookings
- AR hairstyle try-on
- Admin dashboard with analytics
- Profile management

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd barbershop-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories

4. **Environment Setup**
   - Configure Firebase settings in `lib/firebase.ts`
   - Update Firestore security rules for your use case

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on devices**
   - **iOS**: `npx expo run:ios`
   - **Android**: `npx expo run:android`
   - **Web**: `npx expo start --web`

## 📁 Project Structure

```
barbershop-app/
├── app/                    # Main app screens (Expo Router)
│   ├── _layout.tsx        # Root layout with navigation
│   ├── welcome.tsx         # Initial entry point
│   ├── onboarding.tsx      # User onboarding flow
│   ├── login.tsx           # Authentication
│   ├── register.tsx        # User registration
│   ├── index.tsx           # Home dashboard
│   ├── new.tsx             # Create booking
│   ├── profile.tsx         # User profile
│   ├── admin.tsx           # Admin dashboard
│   └── success.tsx         # Booking confirmation
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   ├── HairStyleSelector.tsx
│   ├── CameraModal.tsx
│   └── ...
├── contexts/               # React Context providers
│   └── AuthContext.tsx     # Authentication state
├── lib/                    # Utility libraries
│   ├── firebase.ts         # Firebase configuration
│   ├── firebaseService.ts  # Database operations
│   └── adminUtils.ts       # Admin utilities
├── constants/              # App constants
│   └── theme.ts            # Design system
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── assets/                 # Images and static files
    └── hairstyles/         # Hairstyle images
```

## 🔐 Authentication & Security

### User Roles
- **Customer**: Can book appointments, view profile, try hairstyles
- **Admin**: Full access to dashboard, booking management, analytics

### Security Features
- Firebase Authentication with email/password
- Role-based access control
- Secure Firestore rules
- Input validation and sanitization

## 🎯 Key Features Explained

### AR Hairstyle Try-on
- Integrates with external AR service via WebView
- Camera permission handling
- Cross-platform compatibility
- Seamless user experience

### Admin Dashboard
- Real-time booking statistics
- Interactive charts and visualizations
- Advanced filtering system
- Booking approval workflow

### Booking System
- Date/time selection
- Service and stylist selection
- Status tracking (Pending, Confirmed, Cancelled)
- Email notifications

## 🚀 Deployment

### Development Build
```bash
npx expo build:android
npx expo build:ios
```

### Production Build
```bash
npx expo build:android --type app-bundle
npx expo build:ios --type archive
```

### EAS Build (Recommended)
```bash
npm install -g @expo/eas-cli
eas build --platform all
```

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Configure security rules
5. Add configuration files to project

### Environment Variables
Create a `.env` file with:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 📊 Database Schema

### Users Collection
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin';
  createdAt: Date;
}
```

### Bookings Collection
```typescript
{
  id: string;
  userId: string;
  service: string;
  stylist: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}
```

## 🐛 Troubleshooting

### Common Issues
1. **Firebase Connection**: Ensure configuration files are properly placed
2. **Authentication**: Check Firebase Auth settings and rules
3. **Build Issues**: Clear cache with `npx expo start --clear`
4. **Dependencies**: Run `npm install` after pulling changes

### Debug Mode
- Use Expo DevTools for debugging
- Check console logs for errors
- Verify Firebase configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review Firebase documentation for backend issues

## 🎉 Acknowledgments

- Expo team for the amazing framework
- Firebase for backend services
- React Native community for components and libraries
- Contributors and testers

---

**Built with ❤️ using React Native and Expo**
