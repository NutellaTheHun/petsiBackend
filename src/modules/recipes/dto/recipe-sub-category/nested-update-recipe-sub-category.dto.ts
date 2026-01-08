import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { NestedUpdate } from '../../../../common/base/nested-update.base';

export class UpdateRecipeSubCategoryDto extends NestedUpdate {
  @ApiPropertyOptional({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'name',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;
}
