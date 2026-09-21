import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';
import { FEATURE_REGISTRY, Feature } from '../utils/feature.registry';

export class CreateRoleFeatureDto {
    @ApiProperty({ example: 1, description: 'Id of the Role this feature is granted to' })
    @IsInt()
    readonly roleId: number;

    @ApiProperty({
        example: 'RECIPE_MANAGEMENT',
        description: 'Feature to grant. Must be a name registered in the Feature registry.',
        enum: Object.values(FEATURE_REGISTRY),
    })
    @IsIn(Object.values(FEATURE_REGISTRY))
    readonly feature: Feature;
}
