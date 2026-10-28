import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/PublicLogin';
import { SquareOAuthService } from '../services/square-oauth.service';

/**
 * Square's OAuth redirect target (`SQUARE_OAUTH_REDIRECT_URL`). A browser
 * redirect with no Bearer token, so it's `@Public()` and has no feature check:
 * the signed, single-use `state` is the only link to a tenant. Always answers
 * with a redirect to the frontend settings page carrying `?square=<outcome>`.
 * Not part of the frontend API, so excluded from Swagger.
 */
@ApiExcludeController()
@Public()
@Controller('square/oauth')
export class SquareOAuthCallbackController {
    constructor(private readonly oauthService: SquareOAuthService) {}

    @Get('callback')
    @Redirect()
    async callback(
        @Query('code') code?: unknown,
        @Query('state') state?: unknown,
        @Query('error') error?: unknown,
    ): Promise<{ url: string; statusCode: number }> {
        const outcome = await this.oauthService.handleCallback({
            code: asString(code),
            state: asString(state),
            error: asString(error),
        });
        return {
            url: this.oauthService.settingsRedirectUrl(outcome),
            statusCode: 302,
        };
    }
}

/** A repeated query param arrives as an array; treat anything but one string as absent. */
function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}
