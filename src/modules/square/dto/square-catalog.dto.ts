import { ApiProperty } from '@nestjs/swagger';
import {
    SQUARE_MAPPING_SOURCES,
    SQUARE_MODIFIER_MODES,
    SquareMappingSource,
    SquareModifierMode,
} from '../entities/square-variation-link.entity';

/** Which catalog rows `GET /square/catalog` returns. */
export const SQUARE_CATALOG_VIEW = {
    /** Live rows only (the default). */
    ACTIVE: 'active',
    /** Archived or deleted rows only. */
    ARCHIVED: 'archived',
    ALL: 'all',
} as const;

export type SquareCatalogView =
    (typeof SQUARE_CATALOG_VIEW)[keyof typeof SQUARE_CATALOG_VIEW];

export class SquareCategoryLinkDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'V5CHBXHJKLMN4RZQ' })
    squareCategoryId: string;

    @ApiProperty({ example: 'Pies' })
    squareName: string;

    @ApiProperty({
        example: true,
        description: 'The starting `enabled` of new variation links in it',
    })
    enabled: boolean;
}

export class SquareSizeAliasDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({
        example: 'large 10" serves 8-10',
        description: 'The Square variation name, normalized',
    })
    squareVariationName: string;

    @ApiProperty({ type: Number, nullable: true, example: 4 })
    menuItemSizeId: number | null;
}

export class SquareVariationLinkDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'GUN7HNQBH7ZRARYZN52E7O4B' })
    squareVariationId: string;

    @ApiProperty({ example: 'Large 10" serves 8-10' })
    squareVariationName: string;

    @ApiProperty({
        type: String,
        nullable: true,
        example: '1761600000000',
        description: "Square's catalog version (a bigint, as a string)",
    })
    squareVersion: string | null;

    @ApiProperty({ example: false })
    isArchived: boolean;

    @ApiProperty({ example: false })
    isDeleted: boolean;

    @ApiProperty({
        example: true,
        description: 'Disabled variations are skipped on import',
    })
    enabled: boolean;

    @ApiProperty({ type: Number, nullable: true, example: 12 })
    menuItemId: number | null;

    @ApiProperty({ type: Number, nullable: true, example: 4 })
    menuItemSizeId: number | null;

    @ApiProperty({ enum: SQUARE_MODIFIER_MODES, example: 'none' })
    modifierMode: SquareModifierMode;

    @ApiProperty({ enum: SQUARE_MAPPING_SOURCES, example: 'derived' })
    mappingSource: SquareMappingSource;

    @ApiProperty({
        type: Date,
        nullable: true,
        description: 'Null while the link needs review',
    })
    reviewedAt: Date | null;
}

export class SquareCatalogItemDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'TNMEHPNTJRAWYKLFGHU6JQ3W' })
    squareItemId: string;

    @ApiProperty({ example: 'Apple Crumb Pie' })
    squareItemName: string;

    @ApiProperty({ type: String, nullable: true })
    squareCategoryId: string | null;

    @ApiProperty({ example: false })
    isArchived: boolean;

    @ApiProperty({ example: false })
    isDeleted: boolean;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: 12,
        description: 'The item hint: the menu item derived links take',
    })
    menuItemId: number | null;

    @ApiProperty({ type: [SquareVariationLinkDto] })
    variations: SquareVariationLinkDto[];
}

/** The tenant's Square catalog and how it maps to Petsi. */
export class SquareCatalogDto {
    @ApiProperty({ type: [SquareCategoryLinkDto] })
    categories: SquareCategoryLinkDto[];

    @ApiProperty({ type: [SquareSizeAliasDto] })
    sizeAliases: SquareSizeAliasDto[];

    @ApiProperty({ type: [SquareCatalogItemDto] })
    items: SquareCatalogItemDto[];
}
