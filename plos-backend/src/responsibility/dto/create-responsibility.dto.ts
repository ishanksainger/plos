import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsDateString,
  IsInt,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateResponsibilityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['finance', 'health', 'habit', 'family', 'admin'])
  category: string;

  @IsIn(['finance', 'health', 'habits', 'family', 'general'])
  @IsOptional()
  module?: string;

  @IsDateString()
  dueDate: string;

  // userId is injected server-side from JWT — not required in request body
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  personId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  recurrence?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
