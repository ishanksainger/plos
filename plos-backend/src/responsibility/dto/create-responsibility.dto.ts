import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateResponsibilityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['finance', 'health', 'habit', 'family', 'admin'])
  category: string;

  @IsDateString()
  dueDate: string;

  @IsInt()
  userId: number;
}
