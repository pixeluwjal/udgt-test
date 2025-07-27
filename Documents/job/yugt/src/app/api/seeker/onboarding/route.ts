// app/api/seeker/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; // Corrected path to '@/lib/models/User'
import { authMiddleware } from '@/lib/authMiddleware'; // Corrected path to '@/lib/middlewares/authMiddleware'
import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

// Required for file uploads in Next.js API routes
// Ensure you have these environment variables set for production:
// NEXT_PUBLIC_BASE_URL (for email links, etc.)
// JWT_SECRET (for token generation)

// Prevent body parsing for file uploads, we'll parse manually using request.formData()
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  await dbConnect();
  console.log('\n--- API: /api/seeker/onboarding POST - Request received ---');

  // Authenticate and authorize: only job_seeker can complete onboarding
  const authResult = await authMiddleware(request, 'job_seeker');
  if (!authResult.success) {
    console.warn(`API: Onboarding failed auth: ${authResult.message}`);
    return NextResponse.json({ error: authResult.message }, { status: authResult.status });
  }

  // --- FIX START ---
  // Access user data from authResult.user, which contains the DecodedToken
  const authenticatedUser = authResult.user;

  if (!authenticatedUser) {
    // This case should ideally not happen if authResult.success is true,
    // but it's good for type safety and robustness.
    console.error('API: Authenticated user data is unexpectedly null.');
    return NextResponse.json({ error: 'Authentication data missing.' }, { status: 500 });
  }

  const { id: userId, email, role } = authenticatedUser; // Destructure directly from authenticatedUser
  // --- FIX END ---

  // Ensure it's a job_seeker trying to onboard (double-check, though middleware already handles this)
  if (role !== 'job_seeker') {
      console.warn(`API: User ${userId} (role: ${role}) attempted to complete seeker onboarding. Forbidden.`);
      return NextResponse.json({ error: 'Forbidden - Only job seekers can complete this onboarding.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const fullName = formData.get('fullName')?.toString();
    const phone = formData.get('phone')?.toString();
    const skills = formData.get('skills')?.toString();
    const experience = formData.get('experience')?.toString();
    const resumeFile = formData.get('resume') as File | null;

    console.log(`API: Onboarding attempt for user ${userId} (${email}).`);
    console.log(`API: Received data - Full Name: ${fullName}, Phone: ${phone}, Skills: ${skills}, Experience: ${experience}`);
    console.log(`API: Resume file received: ${resumeFile ? resumeFile.name : 'No file'}`);

    if (!fullName || !phone || !skills || !experience || !resumeFile) {
      return NextResponse.json({ error: 'All fields are required: Full Name, Phone, Skills, Experience, and Resume.' }, { status: 400 });
    }

    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed for resumes.' }, { status: 400 });
    }

    // Handle resume file upload
    const uploadDir = path.join(process.cwd(), 'public', 'resumes');
    await fs.mkdir(uploadDir, { recursive: true }); // Ensure directory exists

    const uniqueFileName = `${userId}_${Date.now()}_${resumeFile.name}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    const resumePath = `/resumes/${uniqueFileName}`; // Path accessible publicly

    // Update user document
    const user = await User.findById(userId);

    if (!user) {
      console.error(`API: User ${userId} not found during onboarding update.`);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Ensure username is set if it's undefined (e.g., if user was created only with email)
    if (!user.username) {
        user.username = user.email.split('@')[0];
        console.log(`API: Username was undefined, re-derived from email: '${user.username}'`);
    }

    // Update user fields
    user.candidateDetails = {
      fullName,
      phone,
      skills: skills.split(',').map(s => s.trim()).filter(s => s), // Split skills by comma
      experience,
    };
    user.resumePath = resumePath;
    user.onboardingStatus = 'completed'; // Mark onboarding as complete
    user.firstLogin = false; // Mark firstLogin as false as onboarding is done

    console.log(`API: Before saving, user object has username: '${user.username}'`);

    await user.save();
    console.log(`API: User ${userId} (${email}) onboarding completed and data saved. Resume path: ${resumePath}`);

    // Re-generate token with updated onboardingStatus, firstLogin, and username
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined.');
    }
    const newToken = jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            firstLogin: user.firstLogin,
            isSuperAdmin: user.isSuperAdmin,
            onboardingStatus: user.onboardingStatus,
            username: user.username, // Include updated username in token
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
    console.log(`API: New token generated for user ${userId} with updated onboarding status and username.`);

    // Prepare user object for response (optional, but good practice)
    const responseUser = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        firstLogin: user.firstLogin,
        isSuperAdmin: user.isSuperAdmin,
        onboardingStatus: user.onboardingStatus,
        resumePath: user.resumePath,
        candidateDetails: user.candidateDetails,
    };

    return NextResponse.json(
      { message: 'Onboarding completed successfully!', user: responseUser, token: newToken },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('API: Onboarding error:', error);
    let errorMessage = 'Server error during onboarding.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}