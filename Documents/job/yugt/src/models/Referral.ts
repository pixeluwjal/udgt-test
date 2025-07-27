// models/Referral.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  _id: mongoose.Types.ObjectId;
  referrer: mongoose.Types.ObjectId; // Reference to the job_referrer user
  referredCandidate: mongoose.Types.ObjectId; // Reference to the job_seeker user
  referredCandidateEmail: string; // Store email for quick reference/lookup
  jobTitle: string; // The job the candidate was referred for
  status: 'Pending' | 'Interviewing' | 'Hired' | 'Rejected'; // Current status of this referral
  referredOn: Date; // Date the referral was made
  // You can add more fields here, e.g., 'referralCodeUsed', 'notes', etc.
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema: Schema<IReferral> = new Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Refers to the User model (the job_referrer)
      required: true,
    },
    referredCandidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Refers to the User model (the job_seeker)
      required: true,
      unique: false, // A candidate can be referred multiple times for different jobs or by different referrers
    },
    referredCandidateEmail: { // Storing email for quick access without populating candidate
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Interviewing', 'Hired', 'Rejected'],
      default: 'Pending',
      required: true,
    },
    referredOn: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default (mongoose.models.Referral as mongoose.Model<IReferral>) ||
  mongoose.model<IReferral>('Referral', ReferralSchema);