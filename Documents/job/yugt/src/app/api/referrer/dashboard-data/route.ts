// app/api/referrer/dashboard-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/authMiddleware'; // Corrected import path
import User from '@/models/User'; // Assuming this path is correct for your User model
import dbConnect from '@/lib/dbConnect'; // Corrected import to dbConnect (was connectDB)
import mongoose from 'mongoose'; // For ObjectId conversion

export async function GET(req: NextRequest) {
  await dbConnect(); // Ensure database connection is established
  console.log('\n--- API: /api/referrer/dashboard-data GET - Request received ---');

  try {
    const authResult = await authMiddleware(req, 'job_referrer');

    if (!authResult.success) {
      console.warn('API: Dashboard data fetch failed: Authentication failed.', authResult.message);
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
      console.error('API: Referrer ID not found in token for dashboard data.');
      return NextResponse.json({ message: 'Referrer ID not found in token.' }, { status: 400 });
    }
    console.log('API: Referrer authenticated for dashboard data:', referrerId);

    const referrerObjectId = new mongoose.Types.ObjectId(referrerId);

    // Fetch all users referred by this referrer
    const referredUsers = await User.find({ referredBy: referrerObjectId, role: 'job_seeker' })
      .select('email username createdAt referralCode onboardingStatus candidateDetails') // Ensure 'referralCode' is in select
      .sort({ createdAt: -1 })
      .limit(10) // Adjust limit as needed
      .lean(); // Use .lean() for performance if you're not modifying documents

    const totalReferrals = await User.countDocuments({ referredBy: referrerObjectId, role: 'job_seeker' });

    const recentReferrals = referredUsers.map(user => ({
      id: user._id.toString(),
      candidateName: user.candidateDetails?.fullName || user.username || user.email,
      candidateEmail: user.email,
      referredOn: user.createdAt.toISOString(),
      referralCode: user.referralCode || 'N/A', // Make sure referralCode is mapped here
      onboardingStatus: user.onboardingStatus || 'N/A', // Include onboardingStatus
    }));

    // Construct the response object
    const responseData = {
      totalReferrals: totalReferrals,
      recentReferrals: recentReferrals,
    };

    console.log('API: Dashboard data prepared:', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) { // Keep error as 'any' for now to catch all types
    console.error('API Error in /api/referrer/dashboard-data:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}