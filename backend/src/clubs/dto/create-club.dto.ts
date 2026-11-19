import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

   @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  category: string;


 

  @IsOptional()
  @IsString()
  image?: string;


}