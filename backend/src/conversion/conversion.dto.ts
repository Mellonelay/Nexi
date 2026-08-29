import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, Length } from 'class-validator';

export class ConvertDto {
  @IsString()
  @Length(2, 32)
  from!: string;

  @IsString()
  @Length(2, 32)
  to!: string;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  amount!: number;
}

export class SetConversionRateDto {
  @IsString()
  @Length(3, 64)
  pair!: string;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  rate!: number;
}

export class ConversionRateQueryDto {
  @IsString()
  @Length(2, 32)
  from!: string;

  @IsString()
  @Length(2, 32)
  to!: string;
}
