// models/Internship.ts
import { ObjectId } from "mongodb";

export type InternshipStatus = "Draft" | "Published";
export type InternshipVisibility = "Public" | "Private";
export type InternshipMode = "Virtual" | "Onsite";
export type InternshipDuration = "1 Month" | "2 Months" | "3 Months";
export type CertificateType = "Completion" | "Excellence";

export interface Internship {
  _id?: ObjectId;

  /* ================= BASIC ================= */
  title: string;
  domain: string;
  mode: InternshipMode;
  duration: InternshipDuration;
  startDate?: Date;

  /* ================= PRICING ================= */
  fee: number;
  certificateProvided: boolean;
  certificateType?: CertificateType;

  /* ================= DESCRIPTION ================= */
  shortDescription: string;
  fullDescription: string;

  /* ================= REQUIREMENTS ================= */
  skills: string[];
  eligibility: string;
  prerequisites?: string;

  /* ================= STRUCTURE ================= */
  totalTasks: number;
  weeklyCommitment: string; // e.g. "5–6 hrs"
  mentorship: boolean;

  /* ================= PERKS ================= */
  perks: string[]; // ["Certificate", "LOR", "Paid Opportunity"]

  /* ================= MEDIA ================= */
  bannerImage?: string; // URL
  icon?: string;        // URL

  /* ================= PUBLISH ================= */
  status: InternshipStatus;
  visibility: InternshipVisibility;

  /* ================= META ================= */
  createdAt: Date;
  updatedAt: Date;
}
