import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChildRecipeSubCategoryDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a RecipeCategory entity.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'name',
  })
  @IsString()
  @IsNotEmpty()
  readonly subCategoryName: string;
}
