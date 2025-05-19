import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { PaginatedResult } from '../../../base/paginated-result';

@ApiTags('Recipe Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('recipe-category')
export class RecipeCategoryController extends ControllerBase<RecipeCategory> {
    constructor(
        categoryService: RecipeCategoryService, 
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(categoryService, cacheManager,'RecipeCategoryController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Recipe Category' })
    @ApiCreatedResponse({ description: 'Recipe Category successfully created', type: RecipeCategory })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateRecipeCategoryDto })
    async create(@Body() dto: CreateRecipeCategoryDto): Promise<RecipeCategory> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Recipe Category' })
    @ApiOkResponse({ description: 'Recipe Category successfully updated', type: RecipeCategory })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Recipe Category to update not found.' })
    @ApiBody({ type: UpdateRecipeCategoryDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecipeCategoryDto): Promise<RecipeCategory> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Recipe Category' })
    @ApiNoContentResponse({ description: 'Recipe Category successfully removed' })
    @ApiNotFoundResponse({ description: 'Recipe Category not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Recipe Categories' })
    @ApiOkResponse({ type: PaginatedResult<RecipeCategory> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<RecipeCategory>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Recipe Category' })
    @ApiOkResponse({ description: 'Recipe Category found', type: RecipeCategory })
    @ApiNotFoundResponse({ description: 'Recipe Category not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RecipeCategory> {
        return super.findOne(id);
    }
}