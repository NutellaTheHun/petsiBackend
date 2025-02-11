import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { ServiceController } from './service/service.controller';

@Module({
  controllers: [RecipesController, ServiceController]
})
export class RecipesModule {}
