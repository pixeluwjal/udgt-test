// app/api/users/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import User from '../../lib/models/User';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { clerkUserId, email, firstName, lastName, plan, verified } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ clerkUserId }, { email }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      clerkUserId,
      email,
      firstName,
      lastName,
      plan,
      verified,
      signupDate: new Date(),
    });

    await newUser.save();

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}