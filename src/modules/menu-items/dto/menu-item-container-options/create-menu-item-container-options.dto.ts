import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { MenuItem } from "../../entities/menu-item.entity";
import { CreateChildMenuItemContainerRuleDto } from "../menu-item-container-rule/create-child-menu-item-container-rule.dto";

/**
 * Depreciated, only created as a child through {@link MenuItem}.
 */
export class CreateMenuItemContainerOptionsDto {
    @ApiProperty({
        description: 'Id of the MenuItem entity that the options apply to.',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    parentContainerMenuItemId: number;

    @ApiProperty({
        description: 'The list of MenuItems and their sizes that are allowed in the container',
        type: [CreateChildMenuItemContainerRuleDto]
    })
    @IsArray()
    containerRuleDtos: CreateChildMenuItemContainerRuleDto[];

    @ApiProperty({ description: 'The total size of the container. When ordered, the summation of ordermenuitemcomponents have to equal this value.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    validQuantity: number;
}