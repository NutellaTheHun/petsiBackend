import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { SquareLocationLinkDto } from '../dto/square-location-link.dto';
import { UpdateSquareLocationLinkEnabledDto } from '../dto/update-square-location-link-enabled.dto';
import { UpdateSquareLocationLinkLocationDto } from '../dto/update-square-location-link-location.dto';
import { TenantAdminGuard } from '../guards/tenant-admin.guard';
import { SquareLocationLinkService } from '../services/square-location-link.service';

@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@UseGuards(TenantAdminGuard)
@ApiForbiddenResponse({
    description:
        'Tenant lacks SQUARE_INTEGRATION, or caller is not a tenant admin',
})
@Controller('square/location-links')
export class SquareLocationLinkController {
    constructor(private readonly linkService: SquareLocationLinkService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Lists the tenant's Square locations and their mapping (tenant admins)",
    })
    @ApiOkResponse({ type: [SquareLocationLinkDto] })
    async findAll(): Promise<SquareLocationLinkDto[]> {
        return this.linkService.findAllForCurrentTenant();
    }

    @Patch(':id/location')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Maps a Square location to a Petsi location, or unmaps and disables it with null (tenant admins)',
    })
    @ApiOkResponse({ type: SquareLocationLinkDto })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the Petsi location does not exist',
    })
    @ApiNotFoundResponse({ description: 'No such location link' })
    async setLocation(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareLocationLinkLocationDto,
    ): Promise<SquareLocationLinkDto> {
        return this.linkService.setLocationForCurrentTenant(id, dto.locationId);
    }

    @Post(':id/create-location')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary:
            'Creates a Petsi location named after the Square location and maps the link to it (tenant admins)',
    })
    @ApiCreatedResponse({ type: SquareLocationLinkDto })
    @ApiNotFoundResponse({ description: 'No such location link' })
    async createLocation(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareLocationLinkDto> {
        return this.linkService.createLocationForCurrentTenant(id);
    }

    @Patch(':id/enabled')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Enables or disables importing a Square location's orders; enabling runs the initial import (tenant admins)",
    })
    @ApiOkResponse({ type: SquareLocationLinkDto })
    @ApiBadRequestResponse({
        description:
            'VALIDATION_ERROR (MISSING_PROPERTY on locationId): enabling an unmapped link',
    })
    @ApiNotFoundResponse({ description: 'No such location link' })
    async setEnabled(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareLocationLinkEnabledDto,
    ): Promise<SquareLocationLinkDto> {
        return this.linkService.setEnabledForCurrentTenant(id, dto.enabled);
    }
}
