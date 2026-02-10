import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRecipeSubCategoryDto {
    @ApiProperty({
        description: 'Name of the RecipeSubCategory entity.',
        example: 'name',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
