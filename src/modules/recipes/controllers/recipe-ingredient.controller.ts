import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';

@Controller('recipe-ingredient')
export class RecipeIngredientController extends ControllerBase<RecipeIngredient>{
    constructor(
        private readonly ingredientService: RecipeIngredientService
    ){ super(ingredientService); }
}
