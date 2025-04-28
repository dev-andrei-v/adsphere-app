import { UserType } from '../user/enums/user-type.enum';

export interface JwtPayload {
  id: string;
  email: string;
  userType: UserType;
}
