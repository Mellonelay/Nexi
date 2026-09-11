import { IsEnum, IsInt, IsString, Length, Matches, Min } from 'class-validator';
import { BinarySide } from '../prisma/d1-client';

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

export class OpenBinaryPositionDto {
  @IsString()
  @Length(4, 32)
  pair!: string;

  @IsEnum(BinarySide)
  side!: BinarySide;

  @IsString()
  @Matches(DECIMAL)
  stake!: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}

export class SettleBinaryPositionDto {
  @IsString()
  @Length(1, 128)
  positionId!: string;
}
