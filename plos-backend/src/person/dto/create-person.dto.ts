import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsDateString,
  IsInt,
  IsEmail,
  Matches,
} from 'class-validator';
import { PHONE_PATTERN } from 'src/common/phone.util';

export class CreatePersonDto {
  // Injected from JWT in controller — not required in request body
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'phone must be 8–20 digits (optional + prefix)',
  })
  phone?: string;

  @IsIn(['self', 'father', 'mother', 'partner', 'child', 'sibling', 'other'])
  relation: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}
