// app/api/seeker/saved-jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SavedJob from '@/models/SavedJob'; // Assuming this path is correct for your SavedJob model
import Job from '@/models/Job';           // Assuming this path is correct for your Job model
import { authMiddleware } from '@/lib/authMiddleware'; // Corrected import path
import mongoose from 'mongoose';

// GET /api/seeker/saved-jobs - Fetch all saved jobs for the authenticated job seeker
export async function GET(request: NextRequest) {
  await dbConnect();
  console.log('\n--- API: /api/seeker/saved-jobs GET - Request received ---');

  // Authenticate and authorize: only job_seeker can access their saved jobs
  const authResult = await authMiddleware(request, 'job_seeker');
  if (!authResult.success) {
    console.warn(`API: Fetch saved jobs failed auth: ${authResult.message}`);
    return NextResponse.json({ error: authResult.message }, { status: authResult.status });
  }

  // --- FIX START ---
  // Access user data from authResult.user
  const authenticatedUser = authResult.user;
  if (!authenticatedUser) {
    console.error('API: Authenticated user data is unexpectedly null after successful auth.');
    return NextResponse.json({ error: 'Authentication data missing.' }, { status: 500 });
  }
  const { id: userId, email: userEmail } = authenticatedUser;
  // --- FIX END ---

  try {
    console.log(`API: Fetching saved jobs for job seeker ID: ${userId} (${userEmail}).`);

    const savedJobs = await SavedJob.find({ user: userId })
      .populate('job') // Populate the full job document
      .sort({ savedAt: -1 }) // Sort by most recently saved
      .lean(); // Return plain JavaScript objects

    // Filter out any saved jobs where the 'job' field might be null (if the job was deleted)
    const validSavedJobs = savedJobs.filter(savedJob => savedJob.job !== null);

    console.log(`API: Found ${validSavedJobs.length} valid saved jobs for ${userEmail}.`);

    return NextResponse.json({ savedJobs: validSavedJobs }, { status: 200 });

  } catch (error: unknown) {
    console.error('API: Fetch saved jobs error:', error);
    let errorMessage = 'Server error fetching saved jobs.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/seeker/saved-jobs - Save a job
export async function POST(request: NextRequest) {
  await dbConnect();
  console.log('\n--- API: /api/seeker/saved-jobs POST - Request received ---');

  const authResult = await authMiddleware(request, 'job_seeker');
  if (!authResult.success) {
    console.warn(`API: Save job failed auth: ${authResult.message}`);
    return NextResponse.json({ error: authResult.message }, { status: authResult.status });
  }

  // --- FIX START ---
  const authenticatedUser = authResult.user;
  if (!authenticatedUser) {
    console.error('API: Authenticated user data is unexpectedly null after successful auth.');
    return NextResponse.json({ error: 'Authentication data missing.' }, { status: 500 });
  }
  const { id: userId, email: userEmail } = authenticatedUser;
  // --- FIX END ---

  try {
    const { jobId } = await request.json();
    console.log(`API: Job Seeker ${userEmail} attempting to save job ID: ${jobId}.`);

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return NextResponse.json({ error: 'Valid Job ID is required.' }, { status: 400 });
    }

    // Check if the job actually exists
    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      console.warn(`API: Save job failed: Job with ID ${jobId} not found.`);
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    // Check if the job is already saved by this user
    const existingSavedJob = await SavedJob.findOne({ user: userId, job: jobId });
    if (existingSavedJob) {
      console.warn(`API: Job ${jobId} already saved by ${userEmail}.`);
      return NextResponse.json({ error: 'This job is already saved.' }, { status: 409 });
    }

    const newSavedJob = await SavedJob.create({
      user: userId,
      job: jobId,
    });

    console.log(`API: Job ${jobId} saved successfully by ${userEmail}.`);
    return NextResponse.json(
      { message: 'Job saved successfully!', savedJob: newSavedJob.toObject() },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('API: Save job error:', error);
    let errorMessage = 'Server error saving job.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if ((error as any).code === 11000) { // Duplicate key error
        errorMessage = 'This job is already saved.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/seeker/saved-jobs - Unsave a job
export async function DELETE(request: NextRequest) {
  await dbConnect();
  console.log('\n--- API: /api/seeker/saved-jobs DELETE - Request received ---');

  const authResult = await authMiddleware(request, 'job_seeker');
  if (!authResult.success) {
    console.warn(`API: Unsave job failed auth: ${authResult.message}`);
    return NextResponse.json({ error: authResult.message }, { status: authResult.status });
  }

  // --- FIX START ---
  const authenticatedUser = authResult.user;
  if (!authenticatedUser) {
    console.error('API: Authenticated user data is unexpectedly null after successful auth.');
    return NextResponse.json({ error: 'Authentication data missing.' }, { status: 500 });
  }
  const { id: userId, email: userEmail } = authenticatedUser;
  // --- FIX END ---

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  try {
    console.log(`API: Job Seeker ${userEmail} attempting to unsave job ID: ${jobId}.`);

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return NextResponse.json({ error: 'Valid Job ID is required to unsave.' }, { status: 400 });
    }

    const deleteResult = await SavedJob.deleteOne({ user: userId, job: jobId });

    if (deleteResult.deletedCount === 0) {
      console.warn(`API: Unsave job failed: Job ${jobId} not found in saved list for ${userEmail}.`);
      return NextResponse.json({ error: 'Job not found in your saved list.' }, { status: 404 });
    }

    console.log(`API: Job ${jobId} unsaved successfully by ${userEmail}.`);
    return NextResponse.json({ message: 'Job unsaved successfully!' }, { status: 200 });

  } catch (error: unknown) {
    console.error('API: Unsave job error:', error);
    let errorMessage = 'Server error unsaving job.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}