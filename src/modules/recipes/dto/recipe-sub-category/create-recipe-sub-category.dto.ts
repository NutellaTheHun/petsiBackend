import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { RecipeCategory } from '../../entities/recipe-category.entity';

export class CreateRecipeSubCategoryDto {
    @ApiProperty({
        description: 'Name of the RecipeSubCategory entity.',
        example: 'Sweet Pie',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Id of the RecipeCategory parent entity.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly parentCategoryId: EntityId<RecipeCategory>;
}
