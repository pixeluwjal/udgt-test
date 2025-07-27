// app/api/applications/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Application from '@/models/Application'; // Ensure correct path to your Application model
import Job from '@/models/Job'; // Ensure correct path to your Job model
import mongoose, { Document, Types } from 'mongoose'; // Import Types and Document
import { authMiddleware } from '@/lib/authMiddleware';

// Import the new interfaces
import { IApplicationPopulated,IJobPopulatedForApplication } from '@/models/populated-models';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const applicationId = params.id;

  const authResult = await authMiddleware(request, ['admin', 'job_poster']);

  if (!authResult.success) {
    return NextResponse.json({ error: authResult.message }, { status: authResult.status });
  }

  if (!authResult.user) {
    console.error('API: Auth successful but user object is missing for PATCH.');
    return NextResponse.json({ error: 'Authentication error: User data missing.' }, { status: 500 });
  }
  const { id: authenticatedUserId, role } = authResult.user;

  if (!mongoose.isValidObjectId(applicationId)) {
    return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
  }

  try {
    const { status } = await request.json();

    const validStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid or missing status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Explicitly cast the result of populate to our new interface
    const application = await Application.findById(applicationId)
      .populate<IApplicationPopulated>('job', 'postedBy') // Cast here!
      .exec() as (IApplicationPopulated & Document); // Add & Document for Mongoose methods

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Now TypeScript knows that application.job is of type IJobPopulatedForApplication
    // and correctly has a 'postedBy' property of type Types.ObjectId
    if (role === 'job_poster') {
      if (!application.job || !application.job.postedBy) {
        // This case indicates data inconsistency if a job exists but has no poster
        console.warn(`API: Job Poster ${authenticatedUserId} attempting to update application ${applicationId} for a job without a clear poster.`);
        return NextResponse.json({ error: 'Job details missing or invalid for this application.' }, { status: 400 });
      }

      // Both are Mongoose ObjectId objects, so .toString() comparison is safe
      if (application.job.postedBy.toString() !== authenticatedUserId.toString()) {
        console.warn(`API: Job Poster ${authenticatedUserId} attempted to update application ${applicationId} for a job not posted by them.`);
        return NextResponse.json({ error: 'Forbidden: You can only update applications for jobs you posted.' }, { status: 403 });
      }
    } else if (role !== 'admin') {
      console.warn(`API: Role '${role}' attempted to update application ${applicationId}, which is not allowed.`);
      return NextResponse.json({ error: 'Forbidden: Unauthorized role to update applications.' }, { status: 403 });
    }

    application.status = status;
    await application.save();

    return NextResponse.json(
      { success: true, message: 'Application status updated successfully', application: application.toObject() },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API: PATCH /applications/:id error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error occurred while updating application.' },
      { status: 500 }
    );
  }
}