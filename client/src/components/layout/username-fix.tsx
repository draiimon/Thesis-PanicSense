import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

/**
 * This component fixes the username display issue.
 * It sets the display_username in localStorage during login,
 * ensuring the username shows correctly in the header.
 */
export function UsernameDisplayFix() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.username) {
      // Store the username in localStorage for persistent display
      localStorage.setItem('display_username', user.username);
      
      // Also store the admin status if applicable
      if (user.role === 'admin' || user.username === 'panicsenseadmin') {
        localStorage.setItem('admin_user', JSON.stringify(user));
      }
      
      console.log('✅ Username display fix applied:', user.username);
    }
    
    // Check for direct login overrides from URL
    const urlParams = new URLSearchParams(window.location.search);
    const usernameParam = urlParams.get('username');
    if (usernameParam) {
      localStorage.setItem('display_username', usernameParam);
      console.log('✅ Username override from URL:', usernameParam);
    }
  }, [user]);

  return null; // This is a utility component with no UI
}