import {
  IsString,
  IsIn,
  IsDateString,
  IsInt,
  IsOptional,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Partial update for a responsibility. Omitted fields are left unchanged.
 * `personId` may be sent as `null` to unassign.
 */
export class UpdateResponsibilityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['finance', 'health', 'habit', 'family', 'admin'])
  category?: string;

  @IsOptional()
  @IsIn(['finance', 'health', 'habits', 'family', 'general'])
  module?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsInt()
  personId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  amount?: number | null;

  @IsOptional()
  @IsIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
  recurrence?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
