import {
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
    RawBodyRequest,
    Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../../common/decorators/PublicLogin';
import { SquareWebhookService } from '../services/square-webhook.service';

/** Also excluded from `TenantResolutionMiddleware` (see `AppModule`). */
export const SQUARE_WEBHOOK_PATH = 'square/webhooks';

/**
 * The app-level Square webhook subscription's notification URL
 * (`SQUARE_WEBHOOK_NOTIFICATION_URL`). Square sends no JWT, so it's
 * `@Public()` with no feature check: the signature over `req.rawBody` is the
 * auth, and the tenant's flag is checked after the tenant is resolved from the
 * merchant id. A bad signature is a 403; everything else is a 200. Not part of
 * the frontend API, so excluded from Swagger.
 */
@ApiExcludeController()
@Public()
@Controller(SQUARE_WEBHOOK_PATH)
export class SquareWebhookController {
    constructor(private readonly webhookService: SquareWebhookService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async receive(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-square-hmacsha256-signature') signature?: string,
    ): Promise<void> {
        await this.webhookService.handle(req.rawBody, signature);
    }
}
