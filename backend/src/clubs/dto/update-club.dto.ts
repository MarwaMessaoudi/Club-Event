import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClubDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;


  
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  category?: string;
  
  @IsOptional()
  @IsString()
  image?: string;
}