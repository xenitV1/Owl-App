import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, token } = await request.json();

    if (!userId || !secret || !token) {
      return NextResponse.json(
        { error: 'User ID, secret, and token are required' },
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps for clock drift
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 15).toUpperCase()
    );

    // Store the secret permanently (in production, this would be in your database)
    const user2FAData = (global as any).user2FAData || new Map();
    user2FAData.set(userId, {
      secret,
      backupCodes,
      enabled: true,
      enabledAt: new Date().toISOString(),
    });
    (global as any).user2FAData = user2FAData;

    // Clean up temporary secret
    const tempSecrets = (global as any).temp2FASecrets || new Map();
    tempSecrets.delete(userId);
    (global as any).temp2FASecrets = tempSecrets;

    return NextResponse.json({
      success: true,
      backupCodes,
    });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}