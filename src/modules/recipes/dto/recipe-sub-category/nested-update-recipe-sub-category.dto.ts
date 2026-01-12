import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { NestedUpdateDto } from '../../../../common/base/nested-update-dto.base';

export class NestedUpdateRecipeSubCategoryDto extends NestedUpdateDto {
  @ApiPropertyOptional({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'name',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;
}
