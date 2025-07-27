// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { DecodedToken } from '@/lib/authMiddleware';

export async function DELETE(request: NextRequest) {
  await dbConnect();
  console.log('\n--- API: /api/admin/users/[id] DELETE - Request received ---');

  // 1. Authenticate and Authorize Admin
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('API: User deletion failed: No token provided or invalid format.');
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

    // Only admins (including super admins) can delete users
    if (decodedToken.role !== 'admin') {
      console.warn(`API: User deletion failed: User ${decodedToken.id} (Role: ${decodedToken.role}) is not an admin.`);
      return NextResponse.json(
        { error: 'Forbidden - Only administrators can delete users.' },
        { status: 403 }
      );
    }
    console.log('API: Admin user authenticated for user deletion:', decodedToken.id);

  } catch (error: unknown) {
    console.warn('API: User deletion failed: Invalid token.', error);
    let errorMessage = 'Unauthorized - Invalid token.';
    if (error instanceof Error) {
        errorMessage = `Unauthorized - Invalid token: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }

  // 2. Extract User ID from URL
  const segments = request.url.split('/');
  const userIdToDelete = segments[segments.length - 1];
  console.log(`API: Attempting to delete user with ID: ${userIdToDelete}`);

  // 3. Validation and Authorization Checks
  if (!userIdToDelete) {
    console.warn('API: User deletion failed: User ID not provided in URL.');
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  // Prevent an admin from deleting their own account
  if (decodedToken.id === userIdToDelete) {
    console.warn(`API: Admin ${decodedToken.id} attempted to delete their own account.`);
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 403 });
  }

  try {
    const userToDelete = await User.findById(userIdToDelete);

    if (!userToDelete) {
      console.warn(`API: User deletion failed: User with ID ${userIdToDelete} not found.`);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Super Admin specific protection:
    // A regular admin cannot delete a super admin.
    // A super admin can delete another super admin.
    if (userToDelete.isSuperAdmin && !decodedToken.isSuperAdmin) {
      console.warn(`API: Regular admin ${decodedToken.id} attempted to delete Super Admin ${userIdToDelete}.`);
      return NextResponse.json({ error: 'Only Super Administrators can delete other Super Administrators.' }, { status: 403 });
    }

    // 4. Delete the user
    await User.findByIdAndDelete(userIdToDelete);
    console.log(`API: Successfully deleted user with ID: ${userIdToDelete}`);

    return NextResponse.json(
      { message: 'User deleted successfully.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API: User deletion error:', error);
    let errorMessage = 'Server error deleting user.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
