import { IsArray, IsBoolean, IsDateString, IsInt, IsIn, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateTicketDto {
  @IsString() @Length(1, 200) subject!: string;
  @IsString() @Length(1, 10000) body!: string;
  @IsString() @Length(1, 128) idempotencyKey!: string;
}

export class ReplyTicketDto {
  @IsString() @Length(1, 10000) body!: string;
  @IsOptional() @IsBoolean() internal?: boolean;
  @IsOptional() attachments?: unknown;
  @IsString() @Length(1, 128) idempotencyKey!: string;
}

export class SendMessageDto {
  @IsUUID() recipientId!: string;
  @IsString() @Length(1, 10000) body!: string;
  @IsOptional() attachments?: unknown;
  @IsString() @Length(1, 128) idempotencyKey!: string;
}

export class PageQueryDto {
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
}

export class CreateAnnouncementDto {
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(1, 20000) body!: string;
  @IsOptional() targeting?: unknown;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() @Length(1, 500) reason?: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class UpdateAnnouncementDto {
  @IsOptional() @IsString() @Length(1, 200) title?: string;
  @IsOptional() @IsString() @Length(1, 20000) body?: string;
  @IsOptional() targeting?: unknown;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() @Length(1, 500) reason?: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminMutationDto {
  @IsOptional() @IsString() @Length(1, 500) reason?: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class SendNotificationDto {
  @IsUUID() userId!: string;
  @IsString() @Length(1, 32) type!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(1, 10000) body!: string;
  @IsOptional() @IsString() @Length(1, 500) reason?: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class CreateLearnContentDto {
  @IsString() @Length(1, 160) slug!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(1, 50000) body!: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() @Length(1, 500) reason?: string;
  @IsOptional() @IsString() @Length(8, 128) idempotencyKey?: string;
  @IsOptional() attachments?: unknown;
  @IsOptional() @IsString() @Length(0, 500) summary?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() media?: LearnMediaAssetDto[];
}

export class UpdateLearnContentDto {
  @IsOptional() @IsString() @Length(1, 200) title?: string;
  @IsOptional() @IsString() @Length(1, 500) reason?: string;
  @IsOptional() @IsString() @Length(8, 128) idempotencyKey?: string;
  @IsOptional() @IsString() @Length(1, 50000) body?: string;
  @IsOptional() @IsString() @Length(0, 500) summary?: string;
  @IsOptional() @IsIn(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']) status?: string;
  @IsOptional() attachments?: unknown;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() media?: LearnMediaAssetDto[];
}

export class LearnMediaAssetDto {
  @IsString() @Length(1, 2000) url!: string;
  @IsOptional() @IsString() @Length(0, 500) altText?: string;
  @IsOptional() @IsString() @Length(0, 100) provider?: string;
  @IsOptional() metadata?: unknown;
}

export class CreateLearnCategoryDto {
  @IsString() @Length(1, 160) slug!: string;
  @IsString() @Length(1, 200) name!: string;
  @IsOptional() @IsString() @Length(0, 1000) description?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
}

export class AssignTicketDto {
  @IsUUID() assignedToId!: string;
}
