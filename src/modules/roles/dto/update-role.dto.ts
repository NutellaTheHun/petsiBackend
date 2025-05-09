import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateRoleDto {
    @IsString()
    @IsOptional()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive({ each: true})
    @IsOptional()
    readonly userIds: number[];
}