import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';

export class NestedCreateRecipeSubCategoryDto extends NestedCreateDto {
  @ApiProperty({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'Sweet Pie',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
