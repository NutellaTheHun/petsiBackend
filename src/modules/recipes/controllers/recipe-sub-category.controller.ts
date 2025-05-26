import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';

@ApiTags('Recipe Sub Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('recipe-sub-category')
@ApiExtraModels(RecipeSubCategory)
export class RecipeSubCategoryController extends ControllerBase<RecipeSubCategory> {
    constructor(
        subCategoryService: RecipeSubCategoryService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(subCategoryService, cacheManager, 'RecipeSubCategoryController', requestContextService, logger); }

    /*@Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Recipe Sub Category' })
    @ApiCreatedResponse({ description: 'Recipe Sub Category successfully created', type: RecipeSubCategory })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateRecipeSubCategoryDto })*/
    /**
     * Depreciated, only created as a child through {@link RecipeCategory}.
     */
    async create(@Body() dto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        //return super.create(dto);
        throw new BadRequestException();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Recipe Sub Category' })
    @ApiOkResponse({ description: 'Recipe Sub Category successfully updated', type: RecipeSubCategory })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Recipe Sub Category to update not found.' })
    @ApiBody({ type: UpdateRecipeSubCategoryDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Recipe Sub Category' })
    @ApiNoContentResponse({ description: 'Recipe Sub Category successfully removed' })
    @ApiNotFoundResponse({ description: 'Recipe Sub Category not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Recipe Sub Categories' })
    @ApiOkResponse({ type: PaginatedResult<RecipeSubCategory> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
        @Query('dateBy') dateBy?: string,
        @Query('startDate') startDate?: string,  // ISO format string
        @Query('endDate') endDate?: string, // ISO format string
    ): Promise<PaginatedResult<RecipeSubCategory>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, search, filters, dateBy, startDate, endDate);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Recipe Sub Category' })
    @ApiOkResponse({ description: 'Recipe Sub Category found', type: RecipeSubCategory })
    @ApiNotFoundResponse({ description: 'Recipe Sub Category not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RecipeSubCategory> {
        return super.findOne(id);
    }
}