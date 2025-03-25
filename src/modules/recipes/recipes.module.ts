import { Module } from '@nestjs/common';
import { RecipesController } from './controllers/recipe.controller';
import { ServiceController } from './services/recipe.service';

@Module({
  controllers: [RecipesController, ServiceController]
})
export class RecipesModule {}
