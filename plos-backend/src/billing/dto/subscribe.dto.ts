import { IsIn } from 'class-validator';

export class SubscribeDto {
  @IsIn(['pro', 'family'])
  plan: 'pro' | 'family';

  @IsIn(['monthly', 'yearly'])
  cycle: 'monthly' | 'yearly';
}
