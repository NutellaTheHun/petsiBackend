import {
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TenantFeatureService } from '../services/tenant-feature.service';
import { Feature } from '../utils/feature.registry';

/**
 * A single custom read route — not a `ControllerBase` CRUD surface, since
 * `TenantFeature` has no public write API (see feature-flags PRD). Gated
 * tenant-admin-only for v1 rather than `@Roles(ROLE_ADMIN)`, so a
 * non-admin manager/staff user at a tenant can't read which features the
 * tenant has purchased.
 */
@ApiTags('TenantFeature')
@ApiBearerAuth('access-token')
@Controller('tenant-features')
export class TenantFeatureController {
    constructor(
        private readonly tenantFeatureService: TenantFeatureService,
        private readonly requestContextService: RequestContextService,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Retrieves the caller's tenant's enabled features (tenant-admin only)" })
    @ApiOkResponse({ description: 'The tenant\'s enabled features', isArray: true, type: String })
    @ApiForbiddenResponse({ description: 'Caller is not a tenant admin' })
    async findEnabled(): Promise<Feature[]> {
        if (this.requestContextService.get<boolean>('isTenantAdmin') !== true) {
            throw new ForbiddenException();
        }
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        return this.tenantFeatureService.findEnabledFeatures(tenantId);
    }
}
