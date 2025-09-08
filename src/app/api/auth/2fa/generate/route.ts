import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken } from '@/lib/encryption';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate a unique secret for this user
    const secret = speakeasy.generateSecret({
      name: `Owl Platform (${userId})`,
      issuer: 'Owl Platform',
    });

    // Generate QR code URL
    const qrCodeUrl = secret.otpauth_url;

    // Store the secret temporarily (in production, this would be in your database)
    // For now, we'll store it in memory with the user ID
    const tempSecrets = (global as any).temp2FASecrets || new Map();
    tempSecrets.set(userId, secret.base32);
    (global as any).temp2FASecrets = tempSecrets;

    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json(
      { error: 'Failed to generate 2FA secret' },
      { status: 500 }
    );
  }
}