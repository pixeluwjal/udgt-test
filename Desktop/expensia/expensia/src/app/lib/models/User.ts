// models/User.ts
import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  verified: boolean;
  signupDate: Date;
  lastLogin?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  plan: { type: String, default: 'free' },
  verified: { type: Boolean, default: false },
  signupDate: { type: Date, default: Date.now },
  lastLogin: Date
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);