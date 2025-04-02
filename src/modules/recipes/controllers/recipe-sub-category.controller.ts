import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';

@Controller('recipe-sub-category')
export class RecipeSubCategoryController extends ControllerBase<RecipeSubCategory>{
    constructor(
        private readonly subCategoryService: RecipeSubCategoryService,
    ){ super(subCategoryService); }
}
