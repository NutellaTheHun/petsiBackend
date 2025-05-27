import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';

@ApiTags('Recipe')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('recipe')
@ApiExtraModels(Recipe)
export class RecipeController extends ControllerBase<Recipe> {
    constructor(
        recipeService: RecipeService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(recipeService, cacheManager, 'RecipeController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Recipe' })
    @ApiCreatedResponse({ description: 'Recipe successfully created', type: Recipe })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateRecipeDto })
    async create(@Body() dto: CreateRecipeDto): Promise<Recipe> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Recipe' })
    @ApiOkResponse({ description: 'Recipe successfully updated', type: Recipe })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Recipe to update not found.' })
    @ApiBody({ type: UpdateRecipeDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecipeDto): Promise<Recipe> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Recipe' })
    @ApiNoContentResponse({ description: 'Recipe successfully removed' })
    @ApiNotFoundResponse({ description: 'Recipe not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Recipes' })
    @ApiOkResponse({ type: PaginatedResult<Recipe> })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'search', required: false, type: String,
        description: 'search by Recipe name, and RecipeIngredient name'
    })
    @ApiQuery({
        name: 'filters',
        required: false,
        isArray: true,
        type: String,
        description: `Filterable fields. Use format: field=value. Available filters:\n
          - **category** (e.g., \`category=5\`)\n
          - **subCategory**`,
    })

    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
          - recipeName\n
          - category name (nulls last)\n
          - subCategory name (nulls last)`,
    })

    @ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order: ASC or DESC',
    })

    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
        //@Query('dateBy') dateBy?: string,
        //@Query('startDate') startDate?: string,  // ISO format string
        //@Query('endDate') endDate?: string, // ISO format string
    ): Promise<PaginatedResult<Recipe>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, search, filters, undefined, undefined, undefined);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Recipe' })
    @ApiOkResponse({ description: 'Recipe found', type: Recipe })
    @ApiNotFoundResponse({ description: 'Recipe not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Recipe> {
        return super.findOne(id);
    }
}