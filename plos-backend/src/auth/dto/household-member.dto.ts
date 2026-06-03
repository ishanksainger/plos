import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PHONE_PATTERN } from 'src/common/phone.util';

const RELATIONS = [
  'father',
  'mother',
  'partner',
  'child',
  'sibling',
  'other',
] as const;

/** Optional household member captured at signup (family / shared accounts). */
export class HouseholdMemberDto {
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

  @IsIn([...RELATIONS])
  relation: string;
}
