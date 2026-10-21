import { ArrayNotEmpty, IsArray, IsMongoId, IsString } from 'class-validator';

export class UserContactDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true, message: 'Provided Invalid Ids' })
  contacts!: string[];
}
