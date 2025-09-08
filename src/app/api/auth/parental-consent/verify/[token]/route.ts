import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ token: string }>;
}

interface ConsentRequest {
  token: string;
  minorUserId: string;
  parentName: string;
  parentEmail: string;
  relationship: string;
  createdAt: string;
  expiresAt: string;
  status?: string;
  parentSignature?: string | null;
  respondedAt?: string;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: 'Consent token is required' },
        { status: 400 }
      );
    }

    // Find consent request by token
    const consentStore = (global as any).parentalConsentStore || new Map<string, any>();
    let consentRequest: ConsentRequest | null = null;
    let consentId: string | null = null;
    
    for (const [id, request] of consentStore.entries()) {
      if (request.token === token) {
        consentRequest = request as ConsentRequest;
        consentId = id;
        break;
      }
    }

    if (!consentRequest || !consentId) {
      return NextResponse.json(
        { error: 'Invalid or expired consent token' },
        { status: 404 }
      );
    }

    // Check if consent is expired
    if (new Date() > new Date(consentRequest.expiresAt)) {
      return NextResponse.json(
        { error: 'Consent request has expired' },
        { status: 400 }
      );
    }

    // Return consent details for verification page
    return NextResponse.json({
      success: true,
      consentRequest: {
        consentId,
        minorUserId: consentRequest.minorUserId,
        parentName: consentRequest.parentName,
        parentEmail: consentRequest.parentEmail,
        relationship: consentRequest.relationship,
        createdAt: consentRequest.createdAt,
        expiresAt: consentRequest.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error verifying parental consent token:', error);
    return NextResponse.json(
      { error: 'Failed to verify consent token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { token } = await context.params;
    const { action, parentSignature } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Consent token is required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find and update consent request
    const consentStore = (global as any).parentalConsentStore || new Map<string, any>();
    let consentRequest: ConsentRequest | null = null;
    let consentId: string | null = null;
    
    for (const [id, request] of consentStore.entries()) {
      if (request.token === token) {
        consentRequest = request as ConsentRequest;
        consentId = id;
        break;
      }
    }

    if (!consentRequest || !consentId) {
      return NextResponse.json(
        { error: 'Invalid or expired consent token' },
        { status: 404 }
      );
    }

    // Check if consent is expired
    if (new Date() > new Date(consentRequest.expiresAt)) {
      return NextResponse.json(
        { error: 'Consent request has expired' },
        { status: 400 }
      );
    }

    // Update consent status
    const updatedConsent: ConsentRequest = {
      ...consentRequest,
      status: action === 'approve' ? 'approved' : 'rejected',
      parentSignature: parentSignature || null,
      respondedAt: new Date().toISOString(),
    };

    // Update the consent request
    consentStore.set(consentId, updatedConsent);

    // If approved, update the user's account status
    if (action === 'approve') {
      // In production, you would update the user's account in your database
      console.log(`Parental consent approved for user ${consentRequest.minorUserId}`);
      
      // Update user account to grant full access
      const userAccounts = (global as any).userAccounts || new Map<string, any>();
      const existingAccount = userAccounts.get(consentRequest.minorUserId) || {};
      userAccounts.set(consentRequest.minorUserId, {
        ...existingAccount,
        parentalConsentVerified: true,
        parentalConsentVerifiedAt: new Date().toISOString(),
        accountStatus: 'active',
      });
      (global as any).userAccounts = userAccounts;
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Parental consent has been approved. The minor now has full access to the platform.'
        : 'Parental consent has been rejected. The minor\'s account access will remain restricted.',
      consentStatus: updatedConsent.status,
      respondedAt: updatedConsent.respondedAt,
    });
  } catch (error) {
    console.error('Error processing parental consent response:', error);
    return NextResponse.json(
      { error: 'Failed to process consent response' },
      { status: 500 }
    );
  }
}