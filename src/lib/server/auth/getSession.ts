/**
 * Helper function to get the current user session from BetterAuth
 * Returns the user ID if authenticated, null otherwise
 */
import { auth } from "./index";

export async function getCurrentUserId(request: Request): Promise<string | null> {
  try {
    // BetterAuth requires cookies to be passed in the headers
    // Create a new Headers object with cookies from the request
    const cookieHeader = request.headers.get('cookie') || '';
    const headers = new Headers();
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }
    
    // BetterAuth provides api.getSession() to get session from request
    const session = await auth.api.getSession({ headers });
    
    if (session?.user?.id) {
      return session.user.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

