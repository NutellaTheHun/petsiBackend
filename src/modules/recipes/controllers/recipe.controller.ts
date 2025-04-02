import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';

@Controller('recipe')
export class RecipeController extends ControllerBase<Recipe>{
    constructor(
        private readonly recipeService: RecipeService,
    ){ super(recipeService); }
}
