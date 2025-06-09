import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { RecipeCategory } from '../../entities/recipe-category.entity';

/**
 * Depreciated, only created as a child through {@link RecipeCategory}.
 */
export class CreateRecipeSubCategoryDto {
  @ApiProperty({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'name',
  })
  @IsString()
  @IsNotEmpty()
  readonly subCategoryName: string;

  @ApiProperty({
    description: 'Id of the RecipeCategory parent entity.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentCategoryId: number;
}
