import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import * as fs from "fs";
import * as path from "path";
import { DevelopmentOnlyGuard } from "../auth/development-only.guard";
import {
  UploadFeedbackDto,
  VISUAL_FEEDBACK_IMAGE_DATA_URI,
} from "./feedback.dto";

@ApiTags("Feedback")
@Controller("feedback")
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  @Post("upload")
  @UseGuards(DevelopmentOnlyGuard)
  async uploadFeedback(@Body() data: UploadFeedbackDto) {
    this.logger.log("Receiving visual feedback...");

    // Create feedback directory if it doesn't exist in project root
    const feedbackDir = path.join(process.cwd(), "..", "visual-feedback");
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    // Save image
    const match = data.image.match(VISUAL_FEEDBACK_IMAGE_DATA_URI);
    if (!match) {
      throw new BadRequestException("Unsupported visual feedback image format");
    }
    const mimeType = data.image.slice(5, data.image.indexOf(";"));
    const extension =
      mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
    const base64Data = data.image.slice(data.image.indexOf(",") + 1);
    const fileName = `feedback-${Date.now()}.${extension}`;
    const filePath = path.join(feedbackDir, fileName);

    fs.writeFileSync(filePath, base64Data, "base64");

    // Save metadata
    const metaPath = filePath.replace(path.extname(filePath), ".json");
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          text: data.text,
          annotations: data.annotations,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    this.logger.log(`Feedback saved to ${filePath}`);
    return { ok: true, path: fileName };
  }
}
