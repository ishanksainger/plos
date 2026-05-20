import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString, IsInt } from 'class-validator';

export class CreatePersonDto {
  // Injected from JWT in controller — not required in request body
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['self', 'father', 'mother', 'partner', 'child', 'sibling', 'other'])
  relation: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}
