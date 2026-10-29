import {
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { LocationScope } from '../../../common/decorators/LocationScope';
import { Roles } from '../../../common/decorators/PublicRole';
import { RequiresFeature } from '../../../common/decorators/RequiresFeature';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { SquareOrderIssueDto } from '../dto/square-order-issue.dto';
import {
    SQUARE_ORDER_ISSUE_STATUSES,
    SquareOrderIssueStatus,
} from '../entities/square-order-issue.entity';
import { SquareOrderIssueService } from '../services/square-order-issue.service';

const ISSUE_STATUS_ENUM = Object.fromEntries(
    SQUARE_ORDER_ISSUE_STATUSES.map((status) => [status, status]),
) as Record<SquareOrderIssueStatus, SquareOrderIssueStatus>;

/** Order issues are handled by an admin or manager at the order's location. */
@ApiTags('Square')
@ApiBearerAuth('access-token')
@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)
@Roles(ROLE_ADMIN, ROLE_MANAGER)
@LocationScope('params', 'locationId')
@ApiForbiddenResponse({
    description:
        'Tenant lacks SQUARE_INTEGRATION, or caller is not an admin or manager at the location',
})
@Controller('square/locations/:locationId/order-issues')
export class SquareOrderIssueController {
    constructor(private readonly issueService: SquareOrderIssueService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Lists the location's Square orders Petsi couldn't import (admins and managers at the location)",
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: SQUARE_ORDER_ISSUE_STATUSES,
        description: 'open (default), resolved or dismissed',
    })
    @ApiOkResponse({ type: [SquareOrderIssueDto] })
    async findAll(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Query(
            'status',
            new DefaultValuePipe('open'),
            new ParseEnumPipe(ISSUE_STATUS_ENUM),
        )
        status: SquareOrderIssueStatus,
    ): Promise<SquareOrderIssueDto[]> {
        return this.issueService.findAllForCurrentTenant(locationId, status);
    }

    @Post(':id/retry')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Re-fetches the order from Square and imports it again; success resolves the issue',
    })
    @ApiOkResponse({ type: SquareOrderIssueDto })
    @ApiBadRequestResponse({
        description:
            'VALIDATION_ERROR: the issue is not open, or its reason cannot be retried',
    })
    @ApiConflictResponse({
        description: 'SQUARE_NOT_CONNECTED or SQUARE_REAUTH_REQUIRED',
    })
    @ApiNotFoundResponse({
        description: 'No such issue at this location, or SQUARE_NOT_FOUND',
    })
    async retry(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareOrderIssueDto> {
        return this.issueService.retryForCurrentTenant(locationId, id);
    }

    @Post(':id/dismiss')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Dismisses an issue staff have dealt with outside Petsi',
    })
    @ApiOkResponse({ type: SquareOrderIssueDto })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the issue is already resolved',
    })
    @ApiNotFoundResponse({ description: 'No such issue at this location' })
    async dismiss(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareOrderIssueDto> {
        return this.issueService.dismissForCurrentTenant(locationId, id);
    }
}
