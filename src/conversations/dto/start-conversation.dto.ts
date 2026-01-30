import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartConversationDto {
  @IsString()
  @IsNotEmpty({ message: 'O idioma é obrigatório' })
  language: string;

  @IsString()
  @IsOptional()
  personaId?: string;

  @IsString()
  @IsOptional()
  replicaId?: string;
}
