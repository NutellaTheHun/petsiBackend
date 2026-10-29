import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { SquareAttentionDto } from '../dto/square-attention.dto';
import { SquareAttentionService } from '../services/square-attention.service';

/**
 * Readable by anyone who can read orders (no role required, like
 * `GET /orders`); per-location counts cover only the caller's locations.
 * Only `SQUARE_INTEGRATION` is required: `@RequiresFeature` with several
 * features passes on any one of them.
 */
@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@ApiForbiddenResponse({ description: 'Tenant lacks SQUARE_INTEGRATION' })
@Controller('square/attention')
export class SquareAttentionController {
    constructor(private readonly attentionService: SquareAttentionService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Counts of pending Square lines and open issues per location, and of unmapped and unreviewed links',
    })
    @ApiOkResponse({ type: SquareAttentionDto })
    async get(): Promise<SquareAttentionDto> {
        return this.attentionService.getForCurrentTenant();
    }
}
