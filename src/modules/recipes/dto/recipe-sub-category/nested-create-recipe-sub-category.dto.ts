import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NestedCreate } from '../../../../common/base/nested-create.base';

export class NestedCreateRecipeSubCategoryDto extends NestedCreate {
  @ApiProperty({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'Sweet Pie',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
