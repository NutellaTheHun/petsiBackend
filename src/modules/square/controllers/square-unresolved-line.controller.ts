import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { LocationScope } from '../../../common/decorators/LocationScope';
import { Roles } from '../../../common/decorators/PublicRole';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import {
    MapSquareAdHocLineDto,
    SquareUnresolvedLineDto,
    SquareUnresolvedLineGroupDto,
} from '../dto/square-unresolved-line.dto';
import { SquareUnresolvedLineService } from '../services/square-unresolved-line.service';

/** Unresolved Square lines are resolved by an admin or manager at the order's location. */
@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@Roles(ROLE_ADMIN, ROLE_MANAGER)
@LocationScope('params', 'locationId')
@ApiForbiddenResponse({
    description:
        'Tenant lacks SQUARE_INTEGRATION, or caller is not an admin or manager at the location',
})
@Controller('square/locations/:locationId/unresolved-lines')
export class SquareUnresolvedLineController {
    constructor(private readonly lineService: SquareUnresolvedLineService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Lists the location's pending Square lines, grouped by the Square product that resolves them",
    })
    @ApiOkResponse({ type: [SquareUnresolvedLineGroupDto] })
    async findGroups(
        @Param('locationId', ParseIntPipe) locationId: number,
    ): Promise<SquareUnresolvedLineGroupDto[]> {
        return this.lineService.findGroupsForCurrentTenant(locationId);
    }

    @Post(':id/map')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Maps one ad-hoc line to a menu item and size and adds it to its order',
    })
    @ApiOkResponse({ type: SquareUnresolvedLineDto })
    @ApiBadRequestResponse({
        description:
            'VALIDATION_ERROR: the line is not a pending ad-hoc line, or the menu item or size is invalid',
    })
    @ApiNotFoundResponse({ description: 'No such line at this location' })
    async mapAdHoc(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: MapSquareAdHocLineDto,
    ): Promise<SquareUnresolvedLineDto> {
        return this.lineService.mapAdHocForCurrentTenant(locationId, id, dto);
    }

    @Post(':id/retry')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Places the line again with the current mapping and menu; it stays pending if it still cannot be placed',
    })
    @ApiOkResponse({ type: SquareUnresolvedLineDto })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the line is not pending',
    })
    @ApiNotFoundResponse({ description: 'No such line at this location' })
    async retry(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareUnresolvedLineDto> {
        return this.lineService.retryForCurrentTenant(locationId, id);
    }

    @Post(':id/dismiss')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Dismisses a line staff have dealt with' })
    @ApiOkResponse({ type: SquareUnresolvedLineDto })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the line is already resolved',
    })
    @ApiNotFoundResponse({ description: 'No such line at this location' })
    async dismiss(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareUnresolvedLineDto> {
        return this.lineService.dismissForCurrentTenant(locationId, id);
    }

    @Post(':id/disable-variation')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Disables the line's Square variation: future lines are skipped and its pending lines dismissed",
    })
    @ApiOkResponse({ type: SquareUnresolvedLineDto })
    @ApiBadRequestResponse({
        description:
            'VALIDATION_ERROR: the line is not pending, or has no known variation',
    })
    @ApiNotFoundResponse({ description: 'No such line at this location' })
    async disableVariation(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareUnresolvedLineDto> {
        return this.lineService.disableVariationForCurrentTenant(
            locationId,
            id,
        );
    }
}
