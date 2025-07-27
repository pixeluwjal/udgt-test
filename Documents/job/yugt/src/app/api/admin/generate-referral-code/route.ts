// app/api/admin/generate-referral-code/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User'; // Import User model
import jwt from 'jsonwebtoken';
import { DecodedToken } from '@/lib/authMiddleware';
import sendEmail from '@/lib/emailservice';
import bcrypt from 'bcryptjs'; // Needed for hashing if creating new user

// Define the expected request body for generating a code
interface GenerateCodeRequest {
  candidateEmail: string;
}

// Helper function to generate a unique alphanumeric code
function generateUniqueCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function POST(request: Request) {
  await dbConnect();
  console.log('\n--- API: /api/admin/generate-referral-code POST - Request received ---');

  // 1. Authenticate and Authorize Admin
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('API: Referral code generation failed: No token provided or invalid format.');
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  let decodedToken: DecodedToken;

  try {
    if (!process.env.JWT_SECRET) {
      console.error('API: JWT_SECRET is not defined in environment variables. Server configuration error.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }
    decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    // Only admins (including super admins) can generate referral codes
    if (decodedToken.role !== 'admin') {
      console.warn(`API: Generate referral code failed: User ${decodedToken.id} (Role: ${decodedToken.role}) is not an admin.`);
      return NextResponse.json(
        { error: 'Forbidden - Only administrators can generate referral codes.' },
        { status: 403 }
      );
    }
    console.log('API: Admin user authenticated for referral code generation:', decodedToken.id);

  } catch (error: unknown) {
    console.warn('API: Generate referral code failed: Invalid token.', error);
    let errorMessage = 'Unauthorized - Invalid token.';
    if (error instanceof Error) {
        errorMessage = `Unauthorized - Invalid token: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }

  // 2. Process Request Body
  try {
    const { candidateEmail }: GenerateCodeRequest = await request.json();
    console.log(`API: Admin attempting to generate referral code for: ${candidateEmail}`);

    if (!candidateEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      return NextResponse.json({ error: 'Valid candidate email is required.' }, { status: 400 });
    }

    let user = await User.findOne({ email: candidateEmail });
    let referralCode = generateUniqueCode();
    let isNewUser = false;
    let temporaryPassword = ''; // Declare temporaryPassword here to be accessible later

    // Calculate expiration date (60 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // Add 60 days

    if (user) {
      // User exists, update their role to job_seeker if not already, and assign referral code
      if (user.role !== 'job_seeker') {
        user.role = 'job_seeker';
        console.log(`API: Updated existing user ${candidateEmail} role to 'job_seeker'.`);
      }
      // Ensure generated referral code is unique among all users
      let codeExists = await User.findOne({ referralCode });
      while (codeExists) {
          referralCode = generateUniqueCode();
          codeExists = await User.findOne({ referralCode });
      }
      user.referralCode = referralCode;
      user.referralCodeExpiresAt = expiresAt;
      user.firstLogin = true; // Force onboarding on next login
      user.onboardingStatus = 'pending'; // Reset onboarding status
      await user.save();
      console.log(`API: Updated existing user ${candidateEmail} with new referral code.`);
    } else {
      // User does not exist, create a new job_seeker user
      isNewUser = true;
      const username = candidateEmail.split('@')[0];
      temporaryPassword = Math.random().toString(36).substring(2, 10); // Auto-generate temp password

      // Ensure generated referral code is unique among all users
      let codeExists = await User.findOne({ referralCode });
      while (codeExists) {
          referralCode = generateUniqueCode();
          codeExists = await User.findOne({ referralCode });
      }

      user = new User({
        username,
        email: candidateEmail,
        password: temporaryPassword, // Mongoose pre-save hook will hash this
        role: 'job_seeker', // New user is a job_seeker
        firstLogin: true, // Force onboarding
        isSuperAdmin: false, // Cannot create super admin via this flow
        createdBy: decodedToken.id,
        referralCode,
        referralCodeExpiresAt: expiresAt,
        onboardingStatus: 'pending',
      });
      await user.save();
      console.log(`API: Created new job_seeker user ${candidateEmail} with referral code.`);
    }

    // Send email with referral code
    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login`; // Candidate will use referral code on login page
    const emailSubject = `Your Job Portal Access Code!`;
    // FIX: Use 'temporaryPassword' variable for email content
    const emailText = `Hello ${user.username || candidateEmail},\n\nAn administrator has generated an access code for you to log in to our Job Portal. Your code is: ${referralCode}\n\nThis code is valid for 60 days. Please use it to log in and complete your profile here: ${loginUrl}\n\n${isNewUser ? `Your temporary password is: ${temporaryPassword}\n\n` : ''}Thank you!`;
    const emailHtml = `
      <p>Hello <strong>${user.username || candidateEmail}</strong>,</p>
      <p>An administrator has generated an exclusive access code for you to log in to our Job Portal.</p>
      <p>Your Access Code: <strong>${referralCode}</strong></p>
      <p>This code is valid for 60 days from now (${expiresAt.toDateString()}).</p>
      <p>Please use it to <a href="${loginUrl}" style="color: #1a73e8;">log in</a> and complete your profile.</p>
      ${isNewUser ? `<p>Your temporary password is: <strong>${temporaryPassword}</strong> (You will be prompted to change this on first login.)</p>` : ''}
      <p>We look forward to having you!</p>
      <p>The ${process.env.EMAIL_FROM?.split('<')[0].trim() || 'Job Portal'} Team</p>
    `;

    try {
      await sendEmail({
        to: candidateEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      console.log('API: Referral code email sent successfully to:', candidateEmail);
    } catch (emailError: any) {
      console.error('API: Failed to send referral code email to %s:', candidateEmail, emailError);
    }

    return NextResponse.json(
      {
        message: `Referral code generated and email sent successfully to ${candidateEmail}!`,
        code: referralCode,
        expiresAt,
        isNewUser,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('API: Generate referral code error:', error);
    let errorMessage = 'Server error generating referral code.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error && (error as any).code === 11000) { // Mongoose duplicate key error
        errorMessage = 'A unique referral code could not be generated. Please try again.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
