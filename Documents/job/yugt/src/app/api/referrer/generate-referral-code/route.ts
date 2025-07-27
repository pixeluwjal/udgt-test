// app/api/referrer/generate-referral-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/authMiddleware'; // Corrected import path
import User from '@/models/User'; // Assuming this path is correct for your User model
import dbConnect from '@/lib/dbConnect'; // Corrected import to dbConnect (was connectDB)
import sendEmail from '@/lib/emailservice';
import mongoose from 'mongoose'; // For converting string IDs to ObjectId

// Helper function to generate a unique alphanumeric code
function generateUniqueCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

interface GenerateReferralCodeRequestBody {
  candidateEmail: string;
}

export async function POST(req: NextRequest) {
  await dbConnect(); // Ensure database connection is established
  console.log('\n--- API: /api/referrer/generate-referral-code POST - Request received ---');

  try {
    // 1. Authenticate and authorize: Ensure the user is a logged-in 'job_referrer'
    const authResult = await authMiddleware(req, 'job_referrer');

    if (!authResult.success) {
      console.warn('API: Referral submission failed: Authentication failed.', authResult.message);
      return NextResponse.json(
        { message: authResult.message || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    // --- FIX START ---
    // Access the decoded token payload from authResult.user
    const authenticatedUser = authResult.user;

    if (!authenticatedUser) {
      console.error('API: Authenticated user data is unexpectedly null after successful auth.');
      return NextResponse.json({ message: 'Authentication error: User data missing.' }, { status: 500 });
    }

    const referrerId = authenticatedUser.id; // Use .id from the authenticatedUser object
    // --- FIX END ---

    if (!referrerId) {
      console.error('API: Referrer ID not found in token for referral submission.');
      return NextResponse.json({ message: 'Referrer ID not found in token.' }, { status: 400 });
    }
    console.log('API: Referrer authenticated:', referrerId);

    // Convert referrerId string to ObjectId once
    const referrerObjectId = new mongoose.Types.ObjectId(referrerId);

    // 2. Parse request body
    const { candidateEmail }: GenerateReferralCodeRequestBody = await req.json();
    console.log(`API: Referrer ${referrerId} submitting referral for email: ${candidateEmail}`);

    if (!candidateEmail) {
      console.warn('API: Missing required field: candidateEmail.');
      return NextResponse.json({ message: 'Missing required field: candidateEmail.' }, { status: 400 });
    }

    let isNewUser = false;
    let temporaryPassword = '';
    let referralCode = generateUniqueCode();
    const referredOnDate = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // Code valid for 60 days

    // Ensure generated referral code is unique among all users
    let codeExists = await User.findOne({ referralCode });
    while (codeExists) {
      referralCode = generateUniqueCode();
      codeExists = await User.findOne({ referralCode });
    }
    console.log(`API: Generated unique referral code: ${referralCode}`);

    let candidateUser = await User.findOne({ email: candidateEmail, role: 'job_seeker' });

    if (candidateUser) {
      // Candidate exists, update their referral details
      console.log(`API: Found existing candidate user: ${candidateEmail}. Updating referral details.`);
      candidateUser.referredBy = referrerObjectId;
      candidateUser.referralStatus = 'Pending Onboarding'; // Simplified status
      candidateUser.referredOn = referredOnDate;
      candidateUser.referralCode = referralCode;
      candidateUser.referralCodeExpiresAt = expiresAt;
      candidateUser.firstLogin = true; // Force onboarding/password change if existing user gets new referral
      candidateUser.onboardingStatus = 'pending'; // Set to 'pending' for consistency

      // Ensure candidateDetails exists before trying to access fullName
      if (!candidateUser.candidateDetails) {
        candidateUser.candidateDetails = {};
      }
      // Set fullName if it's not already set, using email prefix as default
      candidateUser.candidateDetails.fullName = candidateUser.candidateDetails.fullName || candidateEmail.split('@')[0];

      await candidateUser.save();
      console.log(`API: Updated existing candidate user ${candidateEmail} with new referral details.`);

    } else {
      // Candidate does not exist, create a new job_seeker user
      isNewUser = true;
      const usernameBase = candidateEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let uniqueUsername = usernameBase;
      let userCount = 0;
      while (await User.findOne({ username: uniqueUsername })) {
        userCount++;
        uniqueUsername = `${usernameBase}${userCount}`;
      }
      temporaryPassword = generateUniqueCode(10); // Use your own generateUniqueCode for password

      console.log(`API: Creating new job_seeker user: ${candidateEmail}. Passing plain-text temp password to model.`);
      candidateUser = new User({
        username: uniqueUsername,
        email: candidateEmail,
        password: temporaryPassword, // Pass plain-text password here; pre-save hook will hash it
        role: 'job_seeker',
        firstLogin: true,
        createdBy: referrerObjectId,
        referredBy: referrerObjectId,
        referralStatus: 'Pending Onboarding', // Simplified status
        referredOn: referredOnDate,
        referralCode: referralCode,
        referralCodeExpiresAt: expiresAt,
        onboardingStatus: 'pending', // Set to 'pending' for consistency
        candidateDetails: {
          fullName: uniqueUsername, // Default full name to username/email part, user can update
        },
      });
      await candidateUser.save(); // The pre-save hook will hash it here.
      console.log(`API: Created new job_seeker user ${candidateEmail} with referral code.`);
    }

    // 5. Send email with referral code and temporary password (if new user)
    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login`;
    const emailSubject = `Your Job Portal Access Code & Invitation!`;
    const emailText = `Hello,\n\n` +
                 `A referrer has invited you to our Job Portal.\n\n` +
                 `Your Access Code: ${referralCode}\n\n` +
                 `This code is valid for 60 days. Please use it to log in and complete your profile here: ${loginUrl}\n\n` +
                 `${isNewUser ? `Your temporary password is: ${temporaryPassword}\n\n` : ''}` +
                 `Thank you!`;
    const emailHtml = `
      <p>Hello,</p>
      <p>Great news! A referrer has invited you to our Job Portal.</p>
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
      // Decide if you want to return 500 here or still 201 if the user was created/updated
      // For now, we'll proceed as user was created/updated successfully
    }

    return NextResponse.json(
      {
        message: 'Referral submitted and email sent successfully!',
        referralId: candidateUser._id,
        generatedReferralCode: referralCode,
        isNewUser: isNewUser,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('API Error in /api/referrer/generate-referral-code:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return NextResponse.json({ message: `A user with the email ${error.keyValue.email} already exists and cannot be assigned as a new job seeker.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}