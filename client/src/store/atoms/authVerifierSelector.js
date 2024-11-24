import { selector } from 'recoil';
import {jwtDecode} from 'jwt-decode';

/**
 * Recoil selector for verifying authentication state from a JWT token.
 * Validates the token's presence, expiration, and structure to determine
 * the user's authentication and authorization status.
 */

export const authenticationState = selector({
  key: 'authenticationState', // Unique key for the selector
  get: () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { isValid: false, isAdmin: false };
    }

    try {
      // Decode token
      const decoded = jwtDecode(token);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        return { isValid: false, isAdmin: false };
      }

      // Verify token signature (You'll need to implement this on the backend)
      // Here we're just checking if the token structure is valid
      if (!decoded.email || !(decoded.admin_id || decoded.user_id)) {
        return { isValid: false, isAdmin: false };
      }

      return {
        isValid: true,
        isAdmin: !!decoded.admin_id,
        email: decoded.email,
        userId: decoded.admin_id || decoded.user_id
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { isValid: false, isAdmin: false };
    }
  },
});
