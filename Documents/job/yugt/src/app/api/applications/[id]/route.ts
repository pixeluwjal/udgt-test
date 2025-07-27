// src/app/api/applications/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/authMiddleware';
import Application from '@/models/Application';
import Job from '@/models/Job';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  console.log(`\n--- API: /api/applications/${params.id} PATCH - Request received ---`);

  const authResult = await authMiddleware(request, ['job_poster', 'admin']);
  if (!authResult.success || !authResult.user) {
    console.warn('API: Update application failed: Authentication failed.', authResult.message);
    return NextResponse.json(
      { message: authResult.message || 'Authentication failed' },
      { status: authResult.status || 401 }
    );
  }

  const { id: applicationId } = params;
  const { user } = authResult;
  const { status, remarks } = await request.json();

  if (!mongoose.isValidObjectId(applicationId)) {
    console.warn(`API: Invalid Application ID: ${applicationId}`);
    return NextResponse.json({ message: 'Invalid Application ID.' }, { status: 400 });
  }

  const allowedStatuses = ['Pending', 'Reviewed', 'Interviewing', 'Offer Extended', 'Hired', 'Rejected'];
  if (status && !allowedStatuses.includes(status)) {
    console.warn(`API: Invalid status provided: ${status}`);
    return NextResponse.json({ message: `Invalid status provided. Allowed: ${allowedStatuses.join(', ')}.` }, { status: 400 });
  }

  try {
    let application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        select: 'postedBy'
      })
      .lean();

    if (!application) {
      console.warn(`API: Application not found with ID: ${applicationId}`);
      return NextResponse.json({ message: 'Application not found.' }, { status: 404 });
    }

    const jobPostedBy = (application.job as any)?.postedBy;
    if (user.role === 'job_poster' && jobPostedBy && jobPostedBy.toString() !== user.id) {
      console.warn(`API: Job Poster ${user.id} not authorized to update application ${applicationId} for job posted by ${jobPostedBy}.`);
      return NextResponse.json({ message: 'Forbidden: You are not authorized to update this application.' }, { status: 403 });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (remarks !== undefined) updateFields.remarks = remarks;

    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'job',
      select: 'title company'
    })
    .populate({
      path: 'applicant',
      select: 'email username candidateDetails.fullName'
    })
    .lean();

    if (!updatedApplication) {
      console.error(`API: Failed to find and update application ${applicationId} after initial find.`);
      return NextResponse.json({ message: 'Failed to update application.' }, { status: 500 });
    }

    console.log(`API: Application ${applicationId} updated successfully to status: ${updatedApplication.status}`);
    return NextResponse.json(
      {
        message: 'Application updated successfully!',
        application: updatedApplication,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`API Error in PATCH /api/applications/${applicationId}:`, error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  console.log(`\n--- API: /api/applications/${params.id} GET - Request received ---`);

  const authResult = await authMiddleware(request, ['job_poster', 'admin', 'job_seeker']);
  if (!authResult.success || !authResult.user) {
    console.warn('API: Fetch application failed: Authentication failed.', authResult.message);
    return NextResponse.json({ error: authResult.message || 'Authentication failed' }, { status: authResult.status || 401 });
  }

  const { id: applicationId } = params;
  const { user } = authResult;

  if (!mongoose.isValidObjectId(applicationId)) {
    console.warn(`API: Invalid Application ID: ${applicationId}`);
    return NextResponse.json({ message: 'Invalid Application ID.' }, { status: 400 });
  }

  try {
    let application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        select: 'title company postedBy'
      })
      .populate({
        path: 'applicant',
        select: 'email username candidateDetails.fullName'
      })
      .lean();

    if (!application) {
      console.warn(`API: Application not found with ID: ${applicationId}`);
      return NextResponse.json({ message: 'Application not found.' }, { status: 404 });
    }

    const jobPostedBy = (application.job as any)?.postedBy;
    const applicantId = (application.applicant as any)?._id;

    if (user.role === 'admin' ||
        (user.role === 'job_poster' && jobPostedBy && jobPostedBy.toString() === user.id) ||
        (user.role === 'job_seeker' && applicantId && applicantId.toString() === user.id)
       ) {
      console.log(`API: Application ${applicationId} fetched successfully.`);
      return NextResponse.json({ application }, { status: 200 });
    } else {
      console.warn(`API: User ${user.id} (role: ${user.role}) not authorized to view application ${applicationId}.`);
      return NextResponse.json({ message: 'Forbidden: You are not authorized to view this application.' }, { status: 403 });
    }

  } catch (error: any) {
    console.error(`API Error in GET /api/applications/${applicationId}:`, error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  console.log(`\n--- API: /api/applications/${params.id} DELETE - Request received ---`);

  const authResult = await authMiddleware(request, ['job_poster', 'admin']);
  if (!authResult.success || !authResult.user) {
    console.warn('API: Delete application failed: Authentication failed.', authResult.message);
    return NextResponse.json({ error: authResult.message || 'Authentication failed' }, { status: authResult.status || 401 });
  }

  const { id: applicationId } = params;
  const { user } = authResult;

  if (!mongoose.isValidObjectId(applicationId)) {
    console.warn(`API: Invalid Application ID: ${applicationId}`);
    return NextResponse.json({ message: 'Invalid Application ID.' }, { status: 400 });
  }

  try {
    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        select: 'postedBy'
      })
      .lean();

    if (!application) {
      console.warn(`API: Application not found with ID: ${applicationId}`);
      return NextResponse.json({ message: 'Application not found.' }, { status: 404 });
    }

    const jobPostedBy = (application.job as any)?.postedBy;
    if (user.role === 'job_poster' && jobPostedBy && jobPostedBy.toString() !== user.id) {
      console.warn(`API: Job Poster ${user.id} not authorized to delete application ${applicationId} for job posted by ${jobPostedBy}.`);
      return NextResponse.json({ message: 'Forbidden: You are not authorized to delete this application.' }, { status: 403 });
    }

    await Application.findByIdAndDelete(applicationId);
    console.log(`API: Application ${applicationId} deleted successfully.`);
    return NextResponse.json({ message: 'Application deleted successfully!' }, { status: 200 });

  } catch (error: any) {
    console.error(`API Error in DELETE /api/applications/${applicationId}:`, error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}