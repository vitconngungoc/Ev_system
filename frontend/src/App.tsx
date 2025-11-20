import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { HomePage } from './components/HomePage';
import { StationsPage } from './components/StationsPage';
import { VehicleListingPage } from './components/VehicleListingPage';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import { ProfilePage } from './components/ProfilePage';
import { BookingHistoryPage } from './components/BookingHistoryPage';
import { PaymentPage } from './components/PaymentPage';
import { RatingPage } from './components/RatingPage';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export type Page = 
  | 'login' 
  | 'register' 
  | 'forgot-password'
  | 'home'
  | 'stations'
  | 'vehicles' 
  | 'vehicle-detail' 
  | 'profile' 
  | 'history' 
  | 'booking-history'
  | 'payment'
  | 'rating'
  | 'staff-dashboard'
  | 'admin-dashboard'
  | 'terms-of-service'
  | 'privacy-policy';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: {
    roleId?: number;
    roleName: string;
  };
  cccd?: string | null;
  gplx?: string | null;
  cccdPath1?: string | null;
  cccdPath2?: string | null;
  gplxPath1?: string | null;
  gplxPath2?: string | null;
  selfiePath?: string | null;
  rejectionReason?: string | null;
  status?: 'ACTIVE' | 'INACTIVE'; // Backend chỉ có 2 trạng thái
  station?: {
    stationId: number;
    name: string;
  } | null;
}

interface AppState {
  currentPage: Page;
  previousPage?: Page;
  authToken: string | null;
  user: User | null;
  selectedModelId?: number | null;
  selectedStationId?: number | null;
  selectedBookingId?: number | null;
}

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        let targetPage: Page = 'home';
        const roleId = user.role?.roleId;
        const roleName = user.role?.roleName;
        
        // Role ID 2 = STATION_STAFF, Role ID 3 = ADMIN
        if (roleId === 2 || roleName === 'STATION_STAFF') {
          targetPage = 'staff-dashboard';
        } else if (roleId === 3 || roleName === 'ADMIN' || roleName === 'EV_ADMIN') {
          targetPage = 'admin-dashboard';
        }
        
        return {
          currentPage: targetPage,
          previousPage: undefined,
          authToken: savedToken,
          user,
          selectedModelId: null,
          selectedStationId: null,
          selectedBookingId: null,
        };
      } catch (e) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    return {
      currentPage: 'home',
      previousPage: undefined,
      authToken: null,
      user: null,
      selectedModelId: null,
      selectedStationId: null,
      selectedBookingId: null,
    };
  });

  // Listen for storage changes to detect logout from another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only check if authToken was changed
      if (e.key === 'authToken') {
        const currentToken = appState.authToken;
        const newToken = e.newValue;
        
        // If token was removed (logout from another tab)
        if (currentToken && !newToken) {
          console.log('🔄 Token removed in another tab, logging out...');
          toast.info('Bạn đã đăng xuất từ tab khác');
          setAppState({
            currentPage: 'home',
            authToken: null,
            user: null,
            selectedModelId: null,
            selectedStationId: null,
            selectedBookingId: null,
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [appState.authToken]);

  // Removed periodic session check - caused false positive logouts
  // Token expiration is handled by backend 401 responses in api.ts
  useEffect(() => {
    // This effect is kept for future enhancements if needed
    // Currently no periodic checks to avoid false logout triggers
    return () => {};
  }, [appState.authToken, appState.user]);

  const navigateTo = (page: Page, arg1?: number, arg2?: number, arg3?: number) => {
    // Handle different parameter patterns based on the page
    let modelId: number | undefined;
    let stationId: number | undefined;
    let bookingId: number | undefined;
    
    if (page === 'rating') {
      // For rating page: (page, bookingId, stationId)
      bookingId = arg1;
      stationId = arg2;
    } else if (page === 'vehicle-detail' || page === 'vehicles') {
      // For vehicle pages: (page, modelId, stationId)
      modelId = arg1;
      stationId = arg2;
    } else {
      // Default: (page, modelId, stationId, bookingId)
      modelId = arg1;
      stationId = arg2;
      bookingId = arg3;
    }
    
    setAppState((prev) => ({
      ...prev,
      currentPage: page,
      previousPage: (page === 'terms-of-service' || page === 'privacy-policy') ? prev.currentPage : prev.previousPage,
      selectedModelId: modelId ?? prev.selectedModelId,
      selectedStationId: stationId ?? prev.selectedStationId,
      selectedBookingId: bookingId ?? prev.selectedBookingId,
    }));
  };

  const setAuth = (token: string, user: User) => {
    // Save to localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Clear redirect flag on successful login
    sessionStorage.removeItem('isRedirecting');
    
    // Route based on user role - check both roleId and roleName
    let targetPage: Page = 'home';
    const roleId = user.role.roleId;
    const roleName = user.role.roleName;
    
    // Role ID 2 = STATION_STAFF, Role ID 3 = ADMIN
    if (roleId === 2 || roleName === 'STATION_STAFF') {
      targetPage = 'staff-dashboard';
    } else if (roleId === 3 || roleName === 'ADMIN' || roleName === 'EV_ADMIN') {
      targetPage = 'admin-dashboard';
    }
    
    setAppState(prev => ({
      ...prev,
      authToken: token,
      user,
      currentPage: targetPage,
    }));
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    setAppState({
      currentPage: 'home',
      authToken: null,
      user: null,
      selectedModelId: null,
      selectedStationId: null,
      selectedBookingId: null,
    });
  };

  const renderPage = () => {
    switch (appState.currentPage) {
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={setAuth} />;
      case 'register':
        return <RegisterPage onNavigate={navigateTo} onLogin={setAuth} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={navigateTo} />;
      case 'home':
        return <HomePage user={appState.user} onNavigate={navigateTo} onLogout={logout} />;
      case 'stations':
        return appState.user ? (
          <StationsPage user={appState.user} onNavigate={navigateTo} onLogout={logout} />
        ) : (
          <LoginPage onNavigate={navigateTo} onLogin={setAuth} />
        );
      case 'vehicles':
        return (
          <VehicleListingPage
            stationId={appState.selectedStationId}
            onNavigate={navigateTo}
            onBack={() => navigateTo('stations')}
          />
        );
      case 'vehicle-detail':
        return (
          <VehicleDetailPage
            modelId={appState.selectedModelId!}
            stationId={appState.selectedStationId}
            authToken={appState.authToken!}
            user={appState.user!}
            onNavigate={navigateTo}
            onBookingCreated={(bookingId) => navigateTo('payment', undefined, undefined, bookingId)}
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
      case 'booking-history':
        return appState.authToken && appState.user ? (
          <BookingHistoryPage
            authToken={appState.authToken}
            onNavigate={navigateTo}
          />
        ) : (
          <LoginPage onNavigate={navigateTo} onLogin={setAuth} />
        );
      case 'rating':
        return appState.authToken && appState.user ? (
          <RatingPage
            authToken={appState.authToken}
            onNavigate={navigateTo}
            bookingId={appState.selectedBookingId!}
            stationId={appState.selectedStationId!}
          />
        ) : (
          <LoginPage onNavigate={navigateTo} onLogin={setAuth} />
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
      case 'staff-dashboard':
        return (
          <StaffDashboard
            user={appState.user!}
            authToken={appState.authToken!}
            onNavigate={navigateTo}
            onLogout={logout}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard
            user={appState.user!}
            authToken={appState.authToken!}
            onNavigate={navigateTo}
            onLogout={logout}
          />
        );
      case 'terms-of-service':
        return <TermsOfServicePage onNavigate={navigateTo} previousPage={appState.previousPage} />;
      case 'privacy-policy':
        return <PrivacyPolicyPage onNavigate={navigateTo} previousPage={appState.previousPage} />;
      default:
        return <LoginPage onNavigate={navigateTo} onLogin={setAuth} />;
    }
  };

  return (
    <>
      {renderPage()}
      <Toaster />
    </>
  );
}

export default App;
