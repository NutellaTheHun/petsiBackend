import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateRecipeSubCategoryDto {
  @ApiProperty({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'Sweet Pie',
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
