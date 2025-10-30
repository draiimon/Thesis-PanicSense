import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@shared/schema';

// Add global type for the window object to allow custom properties
declare global {
  interface Window {
    PanicSenseUserRole?: string;
  }
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  userLocation?: {
    region?: string;
    province?: string;
    city?: string;
    coordinates?: [number, number];
  };
  updateUserLocation: (locationData: AuthContextType['userLocation']) => void;
}

// Safe admin user creation
const createAdminUser = () => ({
  id: 999,
  username: 'panicsenseadmin',
  role: 'admin' as const,
  email: 'admin@panicsense.ph',
  fullName: 'PanicSense Administrator',
  password: '',  // Add empty properties for type compatibility
  createdAt: new Date()
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<AuthContextType['userLocation']>();

  useEffect(() => {
    // DIRECT USERNAME FIX: Save display username directly in localStorage
    const displayUsername = localStorage.getItem('display_username');
    if (displayUsername) {
      console.log("✅ Found stored display username:", displayUsername);
    } else {
      // If no display name is stored, check URL params (useful for when links are shared)
      const urlParams = new URLSearchParams(window.location.search);
      const usernameParam = urlParams.get('username');
      if (usernameParam) {
        console.log("✅ Setting display_username from URL param:", usernameParam);
        localStorage.setItem('display_username', usernameParam);
      }
    }
    
    // Load user location from localStorage
    const locationData = localStorage.getItem('user_location');
    if (locationData) {
      try {
        const parsedLocation = JSON.parse(locationData);
        setUserLocation(parsedLocation);
        console.log("✅ Loaded user location data:", parsedLocation);
      } catch (error) {
        console.error("Failed to parse user location data:", error);
      }
    }

    // Check for existing token and validate it
    const token = localStorage.getItem('auth_token');
    const adminUser = localStorage.getItem('admin_user');
    const userRole = localStorage.getItem('user_role');
    
    console.log("AUTH PROVIDER - Stored role:", userRole);
    
    // Priority check for admin role in localStorage
    if (userRole === 'admin') {
      console.log("⭐ ADMIN ROLE found in localStorage - creating admin user");
      
      // If we have admin user data, use that
      if (adminUser) {
        try {
          const userData = JSON.parse(adminUser);
          // Force admin role
          userData.role = 'admin';
          console.log("Setting user with ADMIN ROLE", userData);
          setUser(userData as User);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse admin user data:', e);
        }
      }
      
      // Create default admin user if no data available
      const defaultAdmin = createAdminUser();
      console.log("Setting DEFAULT admin user", defaultAdmin);
      setUser(defaultAdmin);
      setIsLoading(false);
      return;
    }
    
    // Next check for stored admin user data 
    if (adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        // Ensure role is set
        userData.role = userData.role || 'admin';
        console.log("Setting user from adminUser in localStorage", userData);
        setUser(userData as User);
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to parse admin user data:', e);
        // Fall back to token-based auth if admin data is invalid
        if (token) {
          fetchUser(token);
        } else {
          setIsLoading(false);
        }
      }
    } else if (token) {
      // Regular token-based authentication
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Crucial fix: Ensure user data has role of 'user' instead of 'guest'
        if (userData && userData.role === 'guest') {
          console.log("Converting 'guest' role to 'user' for proper display");
          userData.role = 'user';
        }
        
        // Ensure username is always available - this prevents the "Guest" display
        if (userData && !userData.username && userData.fullName) {
          userData.username = userData.fullName;
        }
        
        // Always save username to localStorage for header display
        if (userData && userData.username) {
          localStorage.setItem('display_username', userData.username);
        }
        
        console.log("✅ Setting user with verified data:", userData);
        setUser(userData);
        
        // Also update localStorage with role information
        if (userData && userData.role) {
          localStorage.setItem('user_role', userData.role);
        }
        
        // Call the API to fix the user's role in the database
        try {
          await fetch('/api/fix-username-display', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log("✅ Username display fix requested");
        } catch (e) {
          console.error("Failed to call username fix API:", e);
        }
      } else {
        // If token is invalid, clear it
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to set up admin login with proper data
  const setupAdminLogin = () => {
    // Create a standardized admin user
    const adminUser = createAdminUser();
    
    // Save all admin data in multiple formats for redundancy
    localStorage.setItem('auth_token', `admin_${Date.now()}`);
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    localStorage.setItem('user_role', 'admin');
    localStorage.setItem('is_admin', 'true');
    localStorage.setItem('display_username', 'panicsenseadmin');
    
    // Set global variable for safety
    window.PanicSenseUserRole = 'admin';
    
    console.log("🔐 ADMIN LOGIN: Setting admin user with maximum security");
    setUser(adminUser);
  };

  const login = (token: string) => {
    localStorage.setItem('auth_token', token);
    
    // Direct username capture from login form
    // Store username in the login form directly to localStorage
    try {
      // Extract username from the login form
      const loginForm = document.querySelector('form');
      if (loginForm) {
        const usernameInput = loginForm.querySelector('input[name="username"]') as HTMLInputElement;
        if (usernameInput && usernameInput.value) {
          console.log("📝 Direct username capture from form:", usernameInput.value);
          localStorage.setItem('display_username', usernameInput.value);
        }
      }
    } catch (e) {
      console.error("Failed to capture username directly from form:", e);
    }
    
    // Handle login form data if available from localStorage
    const loginFormData = localStorage.getItem('login_form_data');
    if (loginFormData) {
      try {
        const formData = JSON.parse(loginFormData);
        // Save username directly to display_username to ensure it shows in header
        if (formData.username) {
          console.log("📝 Setting display_username from login form:", formData.username);
          localStorage.setItem('display_username', formData.username);
          
          // Special case for admin login
          if (formData.username === 'panicsenseadmin' && formData.password === '123456789') {
            console.log("🔐 ADMIN LOGIN from form data detected");
            setupAdminLogin();
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse login form data:", e);
      }
    }
    
    // SPECIAL CASE: Check if this is admin login by checking username and password
    // This special check handles the panicsenseadmin/123456789 credentials
    if (token === 'admin_special_token' || token.includes('panicsenseadmin')) {
      console.log("🔐 SPECIAL ADMIN LOGIN detected");
      setupAdminLogin();
      return;
    }
    
    // First check if user_role is directly set to admin in localStorage
    const userRole = localStorage.getItem('user_role');
    if (userRole === 'admin' || localStorage.getItem('is_admin') === 'true') {
      console.log("🔑 LOGIN: admin role found in localStorage");
      
      // Check for existing admin data
      const adminData = localStorage.getItem('admin_user');
      if (adminData) {
        try {
          const userData = JSON.parse(adminData);
          // Force admin role to ensure it's set correctly
          userData.role = 'admin';
          console.log("🔑 LOGIN: Setting admin user from localStorage:", userData);
          setUser(userData as User);
          return; // Skip fetchUser for admin users
        } catch (e) {
          console.error('Failed to parse admin user data:', e);
        }
      }
      
      // Create default admin user if no admin data is available
      const defaultAdmin = createAdminUser();
      console.log("🔑 LOGIN: Setting default admin user");
      setUser(defaultAdmin);
      return;
    }
    
    // Next check if this is an admin token (starts with 'admin_')
    if (token.startsWith('admin_')) {
      console.log("🔑 LOGIN: Admin token detected");
      
      // Set role to admin in localStorage
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('is_admin', 'true');
      
      // Use admin data from localStorage
      const adminData = localStorage.getItem('admin_user');
      if (adminData) {
        try {
          const userData = JSON.parse(adminData);
          // Force admin role
          userData.role = 'admin';
          console.log("🔑 LOGIN: Setting admin user with role:", userData.role);
          setUser(userData as User);
          return; // Skip fetchUser for admin users
        } catch (e) {
          console.error('Failed to parse admin user data:', e);
        }
      }
      
      // Create default admin user if admin data parsing failed
      const defaultAdmin = createAdminUser();
      console.log("🔑 LOGIN: Setting default admin user");
      setUser(defaultAdmin);
      return;
    }
    
    // For non-admin logins
    // We'll fetch the user data from the API immediately
    console.log("🔄 LOGIN: Fetching user data for regular token...");
    fetchUser(token);
  };

  const logout = () => {
    // Clear all auth-related items from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('is_admin');
    // DON'T remove display_username to ensure it persists
    
    setUser(null);
    // Force reload to clear any cached state
    window.location.href = '/login';
  };

  // User is authenticated if there's a user object
  const isAuthenticated = user !== null;

  // Function to update user location
  const updateUserLocation = (locationData: AuthContextType['userLocation']) => {
    setUserLocation(locationData);
    localStorage.setItem('user_location', JSON.stringify(locationData));
    console.log("✅ Updated user location:", locationData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isAuthenticated,
      userLocation,
      updateUserLocation: updateUserLocation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}