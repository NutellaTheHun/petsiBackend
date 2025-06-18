import { ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateChildRecipeSubCategoryDto } from '../recipe-sub-category/create-child-recipe-sub-category.dto';
import { UpdateChildRecipeSubCategoryDto } from '../recipe-sub-category/update-child-recipe-sub-category.dto copy';

export class UpdateRecipeCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of the RecipeCategory entity.',
    example: 'Pies',
  })
  @IsString()
  @IsOptional()
  readonly categoryName?: string;

  @ApiPropertyOptional({
    description:
      'Mixed array of CreateChildRecipeSubCategoryDtos and UpdateChildRecipeSubCategoryDtos, child dtos are used when updating the parent RecipeCategory with created/updated child RecipeSubCategory entities.',
    type: [CreateChildRecipeSubCategoryDto],
    example: [
      {
        mode: 'create',
        subCategoryName: 'savory pies',
      },
      {
        mode: 'update',
        id: 1,
        subCategoryName: 'dessert pies',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  //@Type(() => RecipeSubCategoryUnionResolver)
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((obj: any) =>
          obj?.mode === 'update'
            ? plainToInstance(UpdateChildRecipeSubCategoryDto, obj)
            : plainToInstance(CreateChildRecipeSubCategoryDto, obj),
        )
      : [],
  )
  readonly subCategoryDtos?: (
    | CreateChildRecipeSubCategoryDto
    | UpdateChildRecipeSubCategoryDto
  )[];
}
