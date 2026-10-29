import {
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    HttpStatus,
    ParseEnumPipe,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/PublicRole';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import {
    SQUARE_CATALOG_VIEW,
    SquareCatalogDto,
    SquareCatalogView,
} from '../dto/square-catalog.dto';
import { SquareCatalogService } from '../services/square-catalog.service';

/** Catalog mapping is tenant-wide: an admin or manager at any location. */
@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@Roles(ROLE_ADMIN, ROLE_MANAGER)
@ApiForbiddenResponse({
    description:
        'Tenant lacks SQUARE_INTEGRATION, or caller is not an admin or manager at any location',
})
@Controller('square/catalog')
export class SquareCatalogController {
    constructor(private readonly catalogService: SquareCatalogService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Lists the tenant's Square items, their variations and how they map to Petsi (admins and managers)",
    })
    @ApiQuery({
        name: 'view',
        required: false,
        enum: Object.values(SQUARE_CATALOG_VIEW),
        description:
            'active (default): live rows; archived: archived or deleted rows only; all',
    })
    @ApiOkResponse({ type: SquareCatalogDto })
    async findCatalog(
        @Query(
            'view',
            new DefaultValuePipe(SQUARE_CATALOG_VIEW.ACTIVE),
            new ParseEnumPipe(SQUARE_CATALOG_VIEW),
        )
        view: SquareCatalogView,
    ): Promise<SquareCatalogDto> {
        return this.catalogService.findCatalogForCurrentTenant(view);
    }
}
