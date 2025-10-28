import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { HomePage } from './components/HomePage';
import { VehicleListingPage } from './components/VehicleListingPage';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import { ProfilePage } from './components/ProfilePage';
import { BookingHistoryPage } from './components/BookingHistoryPage';
import { PaymentPage } from './components/PaymentPage';
import { Toaster } from './components/ui/sonner';

export type Page = 'login' | 'register' | 'forgot-password' | 'home' | 'vehicles' | 'vehicle-detail' | 'profile' | 'history' | 'payment';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: {
    roleName: string;
  };
}

export interface AppState {
  currentPage: Page;
  authToken: string | null;
  user: User | null;
  selectedVehicleId: number | null;
  selectedStationId: number | null;
  selectedBookingId: number | null;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'login',
    authToken: null,
    user: null,
    selectedVehicleId: null,
    selectedStationId: null,
    selectedBookingId: null,
  });

  const navigateTo = (page: Page, id?: number, stationId?: number) => {
    setAppState(prev => ({
      ...prev,
      currentPage: page,
      selectedVehicleId: page === 'vehicle-detail' ? id : prev.selectedVehicleId,
      selectedStationId: stationId ?? prev.selectedStationId,
      selectedBookingId: page === 'payment' ? id : prev.selectedBookingId,
    }));
  };

  const setAuth = (token: string, user: User) => {
    setAppState(prev => ({
      ...prev,
      authToken: token,
      user,
      currentPage: 'home',
    }));
  };

  const logout = () => {
    setAppState({
      currentPage: 'login',
      authToken: null,
      user: null,
      selectedVehicleId: null,
      selectedStationId: null,
      selectedBookingId: null,
    });
  };

  const renderPage = () => {
    switch (appState.currentPage) {
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={setAuth} />;
      case 'register':
        return <RegisterPage onNavigate={navigateTo} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={navigateTo} />;
      case 'home':
        return <HomePage user={appState.user!} onNavigate={navigateTo} onLogout={logout} />;
      case 'vehicles':
        return (
          <VehicleListingPage
            stationId={appState.selectedStationId}
            onNavigate={navigateTo}
            onBack={() => navigateTo('home')}
          />
        );
      case 'vehicle-detail':
        return (
          <VehicleDetailPage
            vehicleId={appState.selectedVehicleId!}
            authToken={appState.authToken!}
            user={appState.user!}
            onNavigate={navigateTo}
            onBack={() => navigateTo('vehicles')}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            user={appState.user!}
            authToken={appState.authToken!}
            onNavigate={navigateTo}
            onUserUpdate={(updatedUser) => setAppState(prev => ({ ...prev, user: updatedUser }))}
          />
        );
      case 'history':
        return (
          <BookingHistoryPage
            authToken={appState.authToken!}
            onNavigate={navigateTo}
            onBack={() => navigateTo('home')}
          />
        );
      case 'payment':
        return (
          <PaymentPage
            bookingId={appState.selectedBookingId!}
            authToken={appState.authToken!}
            onNavigate={navigateTo}
            onBack={() => navigateTo('history')}
          />
        );
      default:
        return <LoginPage onNavigate={navigateTo} onLogin={setAuth} />;
    }
  };

  return (
    <>
      {renderPage()}
      <Toaster position="top-center" />
    </>
  );
}

export default App;
