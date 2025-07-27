import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User, { IUser, OnboardingStatus } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DecodedToken } from "@/lib/authMiddleware";
import sendEmail from "@/lib/emailservice";

interface CreateUserRequest {
  email: string;
  role: "job_poster" | "job_seeker" | "job_referrer" | "admin";
  isSuperAdmin?: boolean;
}

export async function POST(request: Request) {
  await dbConnect();

  // 1. Authentication
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  let decodedToken: DecodedToken;

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }
    decodedToken = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;

    // 2. Authorization
    if (decodedToken.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid token" },
      { status: 401 }
    );
  }

  try {
    // 3. Parse and validate request
    const { email, role, isSuperAdmin } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // 4. Check permissions
    const allowedRoles = ["job_poster", "job_seeker", "job_referrer"];
    if (!decodedToken.isSuperAdmin && !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Insufficient privileges for this role" },
        { status: 403 }
      );
    }

    if (isSuperAdmin && !decodedToken.isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can create super admins" },
        { status: 403 }
      );
    }

    // 5. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // 6. Create new user
    const username = email.split("@")[0];
    const tempPassword = Math.random().toString(36).slice(2, 10);
    const onboardingStatus: OnboardingStatus = role === "job_seeker" ? "pending" : "completed";

    const createdUser = await User.create({
      username,
      email,
      password: tempPassword,
      role,
      isSuperAdmin: !!isSuperAdmin,
      firstLogin: true,
      createdBy: decodedToken.id,
      onboardingStatus
    });

    // 7. Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: "Your New Account",
        text: `Username: ${username}\nTemp Password: ${tempPassword}`,
        html: `
          <p>Welcome to our platform!</p>
          <p>Username: <strong>${username}</strong></p>
          <p>Temporary Password: <strong>${tempPassword}</strong></p>
          <p>Please change your password after first login.</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // 8. Return success response
    return NextResponse.json(
      {
        message: "User created successfully",
        user: createdUser.toJSON() // Uses the transformed output
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}