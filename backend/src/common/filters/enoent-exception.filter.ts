import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";

/**
 * Intercepts Node.js ENOENT (file-not-found) errors thrown by ServeStaticModule
 * when requests arrive for paths that don't exist on disk (e.g. bot scanner probes).
 * Returns a clean 404 JSON response and prevents these errors from being reported
 * to Sentry as unhandled exceptions.
 */
@Catch()
export class EnoentExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      exception instanceof Error &&
      (exception as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      response.status(404).json({ statusCode: 404, message: "Not Found" });
      return;
    }
    // Re-throw anything that isn't an ENOENT so the next filter (SentryGlobalFilter) handles it.
    throw exception;
  }
}
