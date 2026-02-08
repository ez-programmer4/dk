import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Check the code against your database/cache
    // 2. Verify it hasn't expired
    // 3. Mark the email as verified
    // 4. Send confirmation

    // For demo purposes, accept any 6-digit code
    // In production, you'd validate against stored codes
    const isValidCode = code.length === 6 && /^\d{6}$/.test(code);

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Simulate verification success
    console.log(`Email verified for: ${email} with code: ${code}`);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email: email
    });

  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




