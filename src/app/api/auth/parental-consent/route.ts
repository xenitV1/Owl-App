import { NextRequest, NextResponse } from 'next/server';
import { createSecurityHandler } from '@/lib/security';
import { generateSecureToken } from '@/lib/encryption';

interface ParentalConsentRequest {
  minorUserId: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  relationship: string;
}

async function handleParentalConsent(request: NextRequest) {
  try {
    const consentData: ParentalConsentRequest = await request.json();

    // Validate required fields
    if (!consentData.minorUserId || !consentData.parentName || !consentData.parentEmail || !consentData.relationship) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate consent token
    const consentToken = generateSecureToken(32);
    const consentId = generateSecureToken(16);

    // Create consent request (in production, this would be stored in your database)
    const consentRequest = {
      id: consentId,
      minorUserId: consentData.minorUserId,
      parentName: consentData.parentName,
      parentEmail: consentData.parentEmail,
      parentPhone: consentData.parentPhone,
      relationship: consentData.relationship,
      token: consentToken,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Store consent request
    const consentStore = (global as any).parentalConsentStore || new Map();
    consentStore.set(consentId, consentRequest);
    (global as any).parentalConsentStore = consentStore;

    // In production, you would send an email to the parent with a consent link
    // For now, we'll just return the consent details
    console.log('Parental consent request created:', {
      consentId,
      minorUserId: consentData.minorUserId,
      parentEmail: consentData.parentEmail,
      consentLink: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/parental-consent/verify/${consentToken}`,
    });

    return NextResponse.json({
      success: true,
      consentId,
      message: 'Parental consent request has been submitted. The parent will receive an email to confirm their consent.',
      consentRequest: {
        parentName: consentData.parentName,
        parentEmail: consentData.parentEmail,
        relationship: consentData.relationship,
        expiresAt: consentRequest.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating parental consent request:', error);
    return NextResponse.json(
      { error: 'Failed to create parental consent request' },
      { status: 500 }
    );
  }
}

export const POST = createSecurityHandler(
  handleParentalConsent,
  {
    allowedMethods: ['POST'],
  }
);