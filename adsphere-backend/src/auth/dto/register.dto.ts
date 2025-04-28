import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserType } from '../../user/enums/user-type.enum';

export enum RegisterUserTypeEnum {
  USER_INDIVIDUAL = 'USER_INDIVIDUAL',
  USER_BUSINESS = 'USER_BUSINESS',
}

export class RegisterDto {
  @IsString()
  @MinLength(4)
  name: string

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: "password too weak"})
  password: string;

  @IsEnum(RegisterUserTypeEnum)
  type?: RegisterUserTypeEnum ;
}

export interface RegisterResponseDto{
  userId: string;
  name: string;
  email: string;
  type: UserType;
}

