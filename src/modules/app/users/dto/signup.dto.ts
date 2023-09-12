export class SignUpDto {
  email: string;
  password?: string;
  name?: string;
  roleId: string;
  firebaseUid?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  mgp_commission?: number;
  google_id?: string;
  facebook_id?: string;
  logo?: string;
  is_show_logo?: boolean;
  signup_status?: string;
}
