import { IsNotEmpty, IsString } from "class-validator";

export class CreateMenuItemSizeDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}