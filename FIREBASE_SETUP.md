# Firebase Setup Guide

This guide will help you configure Firebase authentication for the Owl Educational Social Media Platform.

## Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in your Firebase project

## Step 1: Configure Authentication Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Under **Authorized domains**, add the following domains:
   - `localhost` (for development)
   - `localhost:3000` (for development)
   - `127.0.0.1` (for development)
   - `127.0.0.1:3000` (for development)
   - Your production domain (e.g., `your-app.vercel.app`)

## Step 2: Configure Google OAuth

1. In the Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Click on the Google provider to configure it
4. Add your project email to the **Project public-facing email**
5. Add your project name to the **Project name**
6. Click **Save**

## Step 3: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost`
   - `http://localhost:3000`
   - `https://your-app.vercel.app` (your production URL)
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**

## Step 4: Update Environment Variables

Update your `.env.local` file with the Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 5: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Choose **External** user type
4. Fill in the required fields:
   - App name: "Owl Educational Social Media"
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
5. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
6. Add test users (during development)
7. Submit for verification (for production)

## Troubleshooting

### "auth/unauthorized-domain" Error

This error occurs when the current domain is not authorized in Firebase. To fix it:

1. Make sure you've added all necessary domains to the **Authorized domains** list in Firebase Authentication settings
2. Check that the domains exactly match (including `http://` vs `https://`)
3. For development, use `localhost` and `localhost:3000`
4. For production, use your actual domain name

### "popup-closed-by-user" Error

This usually happens when:
1. User manually closed the popup window
2. Popup was blocked by browser settings
3. Network issues interrupted the authentication flow

### Network Request Failed

Check your internet connection and make sure Firebase services are accessible from your network.

## Testing

After configuration, test the authentication:

1. Run the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with Google"
4. Complete the Google sign-in flow
5. Verify that you're successfully authenticated

## Production Deployment

For production deployment:

1. Add your production domain to Firebase authorized domains
2. Update Google OAuth credentials with production URLs
3. Submit your OAuth consent screen for verification
4. Test thoroughly in the production environment