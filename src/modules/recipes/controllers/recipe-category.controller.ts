import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';

@Controller('recipe-category')
export class RecipeCategoryController extends ControllerBase<RecipeCategory> {
    constructor(
        private readonly categoryService: RecipeCategoryService
    ){ super(categoryService); }
}
