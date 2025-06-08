export interface LoginRequest {
  email: string;
  password: string;
}

export enum UserType {
  USER_INDIVIDUAL = 'USER_INDIVIDUAL',
  USER_BUSINESS = 'USER_BUSINESS',
}
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  type: UserType;
}
