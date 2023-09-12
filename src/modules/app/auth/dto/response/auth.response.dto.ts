import { App, Role } from '@prisma/client';

export class AuthResponseDto {
  id: string;
  name: string;
  email: string;
  mgp_commission: number | null;
  email_verified_at: string | null;
  remember_token: string | null;
  google_id: string | null;
  facebook_id: string | null;
  access_token: string;
  role: Role;
  userApp: App | null;
  first_name: string | null;
  last_name: string | null;
  avatar?: string | null;
  payment_plan?: string | null;
  payment_period?: string | null;
  subscription_id?: string | null;
  subscription_status?: string | null;
  remain_fix_days?: number;
  account?: string | null;
  signup_status?: string | null;
  check_schedule?: boolean | null;
  firebase_app_id?: string | null;
  free_trial_end_date?: Date | null;
}

export class SalesResponseDto extends AuthResponseDto {
  commission: any;
}
