import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateChildTemplateMenuItemDto {
        readonly mode: 'create' = 'create';

        @IsString()
        @IsNotEmpty()
        readonly displayName: string;

        @IsNumber()
        @IsNotEmpty()
        @IsPositive()
        readonly menuItemId: number;

        @IsNumber()
        @IsNotEmpty()
        @IsPositive()
        readonly tablePosIndex: number;
}