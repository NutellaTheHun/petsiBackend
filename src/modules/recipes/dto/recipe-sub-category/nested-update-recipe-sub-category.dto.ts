import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { UpdateRecipeSubCategoryDto } from './update-recipe-sub-category.dto';

export class NestedUpdateRecipeSubCategoryDto {
  @ApiProperty({
    description: 'Id of the RecipeSubCategory entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'Update dto of a RecipeSubCategory entity.',
    type: UpdateRecipeSubCategoryDto,
    example: {
      subCategoryName: 'Updated Sub Category',
    },
  })
  readonly dto: UpdateRecipeSubCategoryDto;
}
