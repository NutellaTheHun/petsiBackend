import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildMenuItemContainerRuleDto } from "../menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { UpdateChildMenuItemContainerRuleDto } from "../menu-item-container-rule/update-child-menu-item-container-rule.dto";

export class UpdateMenuItemContainerOptionsDto {
    @ApiProperty({ 
        description: 'The list of MenuItems and their sizes that are allowed in the container', 
        type: [CreateChildMenuItemContainerRuleDto] })
    @IsArray()
    @IsOptional()
    containerRuleDtos?: (CreateChildMenuItemContainerRuleDto | UpdateChildMenuItemContainerRuleDto)[];

    @ApiProperty({ description: 'The total size of the container. When ordered, the summation of order-menu-item-components have to equal this value.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    validQuantity?: number;
}