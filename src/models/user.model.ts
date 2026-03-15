import { EntityModel } from './entity.model';

export interface UserModel extends EntityModel {
  firstName: string;
  lastName: string;
  fullName: string;
  userName: string;
  email: string;
  roleId: string;
  roleName: string;
}

export const initialUser: UserModel = {
  id: '',
  firstName: '',
  lastName: '',
  fullName: '',
  userName: '',
  email: '',
  roleId: '',
  roleName: '',
  isActive: true,
  createdAt: '',
  createdBy: '',
  createdFullName: '',
};
