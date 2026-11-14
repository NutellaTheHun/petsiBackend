import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { SquareAuthorizeUrlDto } from '../dto/square-authorize-url.dto';
import { SquareConnectionStatusDto } from '../dto/square-connection-status.dto';
import { UpdateSquareDefaultCategoryDto } from '../dto/update-square-default-category.dto';
import { TenantAdminGuard } from '../guards/tenant-admin.guard';
import { SquareConnectionService } from '../services/square-connection.service';
import { SquareOAuthService } from '../services/square-oauth.service';

@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@UseGuards(TenantAdminGuard)
@ApiForbiddenResponse({
    description:
        'Tenant lacks SQUARE_INTEGRATION, or caller is not a tenant admin',
})
@Controller('square/connection')
export class SquareConnectionController {
    constructor(
        private readonly connectionService: SquareConnectionService,
        private readonly oauthService: SquareOAuthService,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Returns the tenant's Square connection status (tenant admins)",
    })
    @ApiOkResponse({ type: SquareConnectionStatusDto })
    async getStatus(): Promise<SquareConnectionStatusDto> {
        return this.connectionService.getStatusForCurrentTenant();
    }

    @Post('authorize')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Starts connecting Square: returns the Square authorize URL to navigate to (tenant admins)',
    })
    @ApiOkResponse({ type: SquareAuthorizeUrlDto })
    async authorize(): Promise<SquareAuthorizeUrlDto> {
        return this.oauthService.startForCurrentTenant();
    }

    @Delete()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Disconnects Square: revokes access and keeps all mappings for a later reconnect (tenant admins)',
    })
    @ApiOkResponse({ type: SquareConnectionStatusDto })
    @ApiConflictResponse({ description: 'SQUARE_NOT_CONNECTED' })
    async disconnect(): Promise<SquareConnectionStatusDto> {
        return this.connectionService.disconnectForCurrentTenant();
    }

    @Patch('default-category')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Sets or clears the order category stamped on imported orders (tenant admins)',
    })
    @ApiOkResponse({ type: SquareConnectionStatusDto })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the category does not exist',
    })
    @ApiConflictResponse({ description: 'SQUARE_NOT_CONNECTED' })
    async setDefaultCategory(
        @Body() dto: UpdateSquareDefaultCategoryDto,
    ): Promise<SquareConnectionStatusDto> {
        return this.connectionService.setDefaultOrderCategoryForCurrentTenant(
            dto.orderCategoryId,
        );
    }
}
