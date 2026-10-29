import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
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
    MarkSquareLinksReviewedDto,
    SquareSizeAliasSuggestionDto,
    UpdateSquareCategoryLinkEnabledDto,
    UpdateSquareItemHintDto,
    UpdateSquareModifierLinkEnabledDto,
    UpdateSquareModifierLinkMappingDto,
    UpdateSquareSizeAliasDto,
    UpdateSquareVariationLinkDto,
} from '../dto/square-catalog-mapping.dto';
import {
    SQUARE_CATALOG_VIEW,
    SquareCatalogDto,
    SquareCatalogView,
    SquareCategoryLinkDto,
    SquareModifierLinkDto,
    SquareSizeAliasDto,
    SquareVariationLinkDto,
} from '../dto/square-catalog.dto';
import { SquareCatalogMappingService } from '../services/square-catalog-mapping.service';
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
    constructor(
        private readonly catalogService: SquareCatalogService,
        private readonly mappingService: SquareCatalogMappingService,
    ) {}

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

    @Get('size-alias-suggestions')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Groups size aliases whose names differ only in their "serves N" text (admins and managers)',
    })
    @ApiOkResponse({ type: [SquareSizeAliasSuggestionDto] })
    async findSizeAliasSuggestions(): Promise<SquareSizeAliasSuggestionDto[]> {
        return this.mappingService.findSizeAliasSuggestionsForCurrentTenant();
    }

    @Patch('items/:id/menu-item')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            "Sets or clears a Square item's hint and re-derives its non-manual variation links; returns the item's links (admins and managers)",
    })
    @ApiOkResponse({ type: [SquareVariationLinkDto] })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the menu item does not exist',
    })
    @ApiNotFoundResponse({ description: 'No such item hint' })
    async setItemHint(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareItemHintDto,
    ): Promise<SquareVariationLinkDto[]> {
        return this.mappingService.setItemHintForCurrentTenant(
            id,
            dto.menuItemId,
        );
    }

    @Patch('size-aliases/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Sets or clears a size alias and re-derives every non-manual variation link with that name (admins and managers)',
    })
    @ApiOkResponse({ type: SquareSizeAliasDto })
    @ApiBadRequestResponse({
        description: 'VALIDATION_ERROR: the size does not exist',
    })
    @ApiNotFoundResponse({ description: 'No such size alias' })
    async setSizeAlias(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareSizeAliasDto,
    ): Promise<SquareSizeAliasDto> {
        return this.mappingService.setSizeAliasForCurrentTenant(
            id,
            dto.menuItemSizeId,
        );
    }

    @Patch('variations/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Manually overrides a variation link (mapping, modifier mode, enabled); it becomes manual and reviewed (admins and managers)',
    })
    @ApiOkResponse({ type: SquareVariationLinkDto })
    @ApiBadRequestResponse({
        description:
            'VALIDATION_ERROR: unknown menu item, a size the item is not offered in, or container_contents on a non-variable-container item',
    })
    @ApiNotFoundResponse({ description: 'No such variation link' })
    async overrideVariation(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareVariationLinkDto,
    ): Promise<SquareVariationLinkDto> {
        return this.mappingService.overrideVariationLinkForCurrentTenant(
            id,
            dto,
        );
    }

    @Post('variations/:id/reset')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Resets a manual variation link to derived and re-derives it (admins and managers)',
    })
    @ApiOkResponse({ type: SquareVariationLinkDto })
    @ApiNotFoundResponse({ description: 'No such variation link' })
    async resetVariation(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SquareVariationLinkDto> {
        return this.mappingService.resetVariationLinkForCurrentTenant(id);
    }

    @Patch('modifiers/:id/mapping')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Maps a modifier to a menu item and size, ignores it, or clears it; the link becomes manual and reviewed, and same-named non-manual modifiers on the same Square item follow. Returns the link, then the siblings it changed (admins and managers)',
    })
    @ApiOkResponse({ type: [SquareModifierLinkDto] })
    @ApiBadRequestResponse({
        description:
            'VALIDATION_ERROR: unknown or non-SINGLE menu item, a size the item is not offered in, a missing size, or a menu item on an ignored modifier',
    })
    @ApiNotFoundResponse({ description: 'No such modifier link' })
    async setModifierMapping(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareModifierLinkMappingDto,
    ): Promise<SquareModifierLinkDto[]> {
        return this.mappingService.setModifierMappingForCurrentTenant(id, dto);
    }

    @Patch('modifiers/:id/enabled')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Enables or disables one modifier link; it becomes manual and reviewed (admins and managers)',
    })
    @ApiOkResponse({ type: SquareModifierLinkDto })
    @ApiNotFoundResponse({ description: 'No such modifier link' })
    async setModifierEnabled(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareModifierLinkEnabledDto,
    ): Promise<SquareModifierLinkDto> {
        return this.mappingService.setModifierEnabledForCurrentTenant(
            id,
            dto.enabled,
        );
    }

    @Patch('categories/:id/enabled')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Enables or disables a Square category and its non-manual variation and modifier links (admins and managers)',
    })
    @ApiOkResponse({ type: SquareCategoryLinkDto })
    @ApiNotFoundResponse({ description: 'No such category link' })
    async setCategoryEnabled(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSquareCategoryLinkEnabledDto,
    ): Promise<SquareCategoryLinkDto> {
        return this.mappingService.setCategoryEnabledForCurrentTenant(
            id,
            dto.enabled,
        );
    }

    @Post('review')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:
            'Marks variation and modifier links as reviewed (admins and managers)',
    })
    @ApiNoContentResponse()
    async markReviewed(@Body() dto: MarkSquareLinksReviewedDto): Promise<void> {
        await this.mappingService.markReviewedForCurrentTenant(dto);
    }
}
