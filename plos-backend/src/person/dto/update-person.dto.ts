import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PHONE_PATTERN } from 'src/common/phone.util';

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'phone must be 8–20 digits (optional + prefix)',
  })
  phone?: string;

  @IsOptional()
  @IsIn(['self', 'father', 'mother', 'partner', 'child', 'sibling', 'other'])
  relation?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
