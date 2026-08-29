import { ArrayMaxSize, IsArray, IsObject, IsString, Matches, MaxLength } from 'class-validator';

export const VISUAL_FEEDBACK_IMAGE_DATA_URI = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export class UploadFeedbackDto {
  @IsString()
  @Matches(VISUAL_FEEDBACK_IMAGE_DATA_URI)
  @MaxLength(15_000_000)
  image!: string;

  @IsString()
  @MaxLength(10_000)
  text!: string;

  @IsArray()
  @ArrayMaxSize(500)
  @IsObject({ each: true })
  annotations!: Record<string, unknown>[];
}
