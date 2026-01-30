import { IsString, IsOptional } from 'class-validator';

export class EndConversationDto {
  @IsString()
  @IsOptional()
  endedAt?: string; // ISO string
}
