export interface User {
  id?: number;
  people_id?: number;
  profile_id?: number;
  name: string;
  last_name: string;
  full_name?: string;
  email: string;
  email_verified_at?: string;
  password?: string;
  path_img?: string;
  path_img_url?: string;
  path_banner?: string;
  path_banner_url?: string;
  token?: string;
  api_key?: string;
  status?: boolean | number;
  user_ldap_id?: number;
  created_at?: string;
  updated_at?: string;
  organizational_unit?: {
    id: number;
    name: string;
  } | null;
}
