import { IsArray, IsString, IsNotEmpty, IsIn, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class TranscriptMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Role é obrigatório' })
  @IsIn(['user', 'assistant'], { message: 'Role deve ser "user" ou "assistant"' })
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty({ message: 'Content não pode estar vazio' })
  content: string;

  @IsString()
  @IsOptional()
  externalEventId?: string;

  @IsString()
  @IsOptional()
  createdAt?: string; // ISO string
}

export class SaveTranscriptDto {
  @IsArray({ message: 'Messages deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve ter pelo menos uma mensagem' })
  @ValidateNested({ each: true })
  @Type(() => TranscriptMessageDto)
  messages: TranscriptMessageDto[];
}
