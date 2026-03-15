export interface JwtDecodeModel {
  id: string;
  fullName: string;
  userName: string;
  fullNameWithEmail: string;
  email: string;
  role: string;
  permissions: string[];
}

export const initialJwtDecode: JwtDecodeModel = {
  id: '',
  fullName: '',
  userName: '',
  fullNameWithEmail: '',
  email: '',
  role: '',
  permissions: [],
};
