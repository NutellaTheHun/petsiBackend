import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { SquareConnectionStatusDto } from '../dto/square-connection-status.dto';
import { TenantAdminGuard } from '../guards/tenant-admin.guard';
import { SquareConnectionService } from '../services/square-connection.service';

@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@UseGuards(TenantAdminGuard)
@Controller('square/connection')
export class SquareConnectionController {
    constructor(private readonly connectionService: SquareConnectionService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Returns the tenant's Square connection status (tenant admins)",
    })
    @ApiOkResponse({ type: SquareConnectionStatusDto })
    @ApiForbiddenResponse({
        description:
            'Tenant lacks SQUARE_INTEGRATION, or caller is not a tenant admin',
    })
    async getStatus(): Promise<SquareConnectionStatusDto> {
        return this.connectionService.getStatusForCurrentTenant();
    }
}
