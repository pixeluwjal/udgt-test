import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

// 1. Define types
export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "pending";
export type UserRole = "admin" | "job_poster" | "job_seeker" | "job_referrer";
export type ReferralStatus = "Pending Onboarding" | "Onboarding Complete";

// 2. Define base interface without Mongoose-specific fields
export interface IUserBase {
  username: string;
  email: string;
  role: UserRole;
  isSuperAdmin: boolean;
  firstLogin: boolean;
  createdBy?: Types.ObjectId;
  referralCode?: string;
  referralCodeExpiresAt?: Date;
  onboardingStatus?: OnboardingStatus;
  resumePath?: string;
  candidateDetails?: {
    fullName?: string;
    phone?: string;
    skills?: string[];
    experience?: string;
  };
  referredBy?: Types.ObjectId;
  referralStatus?: ReferralStatus;
  referredOn?: Date;
}

// 3. Define document interface that extends Mongoose Document
export interface IUser extends IUserBase, Document {
  password: string;
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// 4. Define schema
const UserSchema: Schema<IUser> = new Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"]
    },
    password: { 
      type: String, 
      required: true, 
      select: false,
      minlength: 8
    },
    role: {
      type: String,
      enum: ["admin", "job_poster", "job_seeker", "job_referrer"],
      required: true,
      default: "job_seeker"
    },
    isSuperAdmin: { 
      type: Boolean, 
      default: false 
    },
    firstLogin: { 
      type: Boolean, 
      default: true 
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    referralCodeExpiresAt: Date,
    onboardingStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "pending"],
      default: "not_started"
    },
    resumePath: String,
    candidateDetails: {
      fullName: String,
      phone: String,
      skills: [String],
      experience: String
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    referralStatus: {
      type: String,
      enum: ["Pending Onboarding", "Onboarding Complete"]
    },
    referredOn: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        const { password, __v, ...user } = ret;
        return {
          ...user,
          _id: user._id.toString()
        };
      }
    }
  }
);

// 5. Password hashing middleware
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// 6. Model export
const UserModel = mongoose.models.User as mongoose.Model<IUser> || 
                  mongoose.model<IUser>("User", UserSchema);

export default UserModel;