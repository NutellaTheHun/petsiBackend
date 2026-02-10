import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NestedUpdateDto } from '../../../../common/base/nested-update-dto.base';

export class NestedUpdateRecipeSubCategoryDto extends NestedUpdateDto {
    @ApiProperty({
        description: 'Name of the RecipeSubCategory entity.',
        example: 'name',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
