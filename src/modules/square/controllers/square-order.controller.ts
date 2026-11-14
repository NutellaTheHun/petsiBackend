import {
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { LocationScope } from '../../../common/decorators/LocationScope';
import { Roles } from '../../../common/decorators/PublicRole';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { SquareOrderDetachService } from '../services/square-order-detach.service';

/** Actions on imported orders, by an admin or manager at the order's location. */
@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@Roles(ROLE_ADMIN, ROLE_MANAGER)
@LocationScope('params', 'locationId')
@ApiForbiddenResponse({
    description:
        'Tenant lacks SQUARE_INTEGRATION, or caller is not an admin or manager at the location',
})
@Controller('square/locations/:locationId/orders')
export class SquareOrderController {
    constructor(private readonly detachService: SquareOrderDetachService) {}

    @Post(':orderId/detach')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:
            'Detaches an imported order from Square: its fields and lines become editable, its pending Square lines are dismissed, and later Square updates are ignored',
    })
    @ApiNoContentResponse({
        description: 'Detached (or already detached)',
    })
    @ApiNotFoundResponse({
        description:
            'No order imported from Square with this id at this location',
    })
    async detach(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<void> {
        await this.detachService.detachForCurrentTenant(locationId, orderId);
    }
}
