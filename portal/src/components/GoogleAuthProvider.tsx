'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1012036745823-pe5t9itf1bvgjvj3tutvhleegsokbg9c.apps.googleusercontent.com';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
