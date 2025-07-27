// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User'; // Import IUser for type safety
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  await dbConnect();
  console.log('\n--- API: /api/auth/login - Request received ---'); // Changed DEBUG to API

  try {
    const { email, password: rawPassword } = await request.json(); // Rename password to rawPassword
    const password = rawPassword ? String(rawPassword).trim() : ''; // Trim the incoming password
    
    console.log(`API: Attempting login for email: ${email}`);
    console.log(`API: Provided password (raw - trimmed): '${password}'`); // Log trimmed password

    // 1. Find user by email and explicitly select password
    const user: (IUser & { password?: string }) | null = await User.findOne({ email }).select('+password');
    if (!user) {
      console.warn(`API: Login failed for email ${email}: User not found.`); // Changed DEBUG to API
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      console.warn(`API: Login failed for email ${email}: Incorrect password.`); // Changed DEBUG to API
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Generate JWT Token
    if (!process.env.JWT_SECRET) {
      console.error('API: JWT_SECRET is not defined in environment variables. Server configuration error.'); // Changed DEBUG to API
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email, // <-- FIX: Include email in the token payload
        role: user.role,
        firstLogin: user.firstLogin,
        isSuperAdmin: user.isSuperAdmin,
        onboardingStatus: user.onboardingStatus, // Include onboardingStatus in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );
    console.log(`API: Token generated for user: ${user.email}`); // Changed DEBUG to API

    // 4. Prepare User Object for Response (exclude password)
    const responseUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      firstLogin: user.firstLogin,
      isSuperAdmin: user.isSuperAdmin,
      onboardingStatus: user.onboardingStatus, // Include onboardingStatus in user object
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    console.log(`API: Login successful for user: ${user.email}, firstLogin: ${user.firstLogin}, onboardingStatus: ${user.onboardingStatus}`); // Changed DEBUG to API

    // 5. Return success response with token and user data
    return NextResponse.json(
      { message: 'Login successful', token, user: responseUser },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API: Login error:', error); // Changed DEBUG to API
    let errorMessage = 'Server error during login.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}