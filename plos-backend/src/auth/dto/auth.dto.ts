import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
  Length,
  Matches,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ACCOUNT_TYPES } from '../account-type';
import { PHONE_PATTERN } from 'src/common/phone.util';
import { HouseholdMemberDto } from './household-member.dto';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ACCOUNT_TYPES])
  accountType?: string;

  /** Optional circle members when account type is family or shared. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HouseholdMemberDto)
  householdMembers?: HouseholdMemberDto[];
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/** Partial profile update for the authenticated user (`PATCH /auth/me`). */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ACCOUNT_TYPES])
  accountType?: string;

  /** Optional — for WhatsApp / SMS reminders (Step J). */
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'phone must be 8–20 digits (optional + prefix)',
  })
  phone?: string;
}
