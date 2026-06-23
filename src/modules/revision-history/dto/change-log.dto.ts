import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class ActorDto {
    @ApiProperty({ enum: ['user', 'system', 'square_webhook'] })
    type: 'user' | 'system' | 'square_webhook';

    @ApiProperty({ required: false, description: 'User id when type is user; optional for system' })
    id?: number;
}

export class RevertInfoDto {
    @ApiProperty()
    targetRevision: number;
}

export class ScalarChangeDto {
    @ApiProperty({ enum: ['scalar'] })
    op: 'scalar';

    @ApiProperty()
    path: string;

    @ApiProperty({ required: false, nullable: true })
    from?: unknown;

    @ApiProperty({ required: false, nullable: true })
    to?: unknown;
}

export class AggregateChangeDto {
    @ApiProperty({ enum: ['aggregate'] })
    op: 'aggregate';

    @ApiProperty()
    path: string;

    @ApiProperty()
    added: number;

    @ApiProperty()
    removed: number;

    @ApiProperty()
    modified: boolean;
}

export class ReferenceChangeDto {
    @ApiProperty({ enum: ['reference'] })
    op: 'reference';

    @ApiProperty()
    path: string;

    @ApiProperty({ required: false, nullable: true })
    from?: number | string | null;

    @ApiProperty({ required: false, nullable: true })
    to?: number | string | null;

    @ApiProperty({ required: false })
    reason?: string;
}

export type ChangeLogChangeDto =
    | ScalarChangeDto
    | AggregateChangeDto
    | ReferenceChangeDto;

@ApiExtraModels(ScalarChangeDto, AggregateChangeDto, ReferenceChangeDto, ActorDto, RevertInfoDto)
export class ChangeLogDto {
    @ApiProperty({ example: 1 })
    schemaVersion: number;

    @ApiProperty({ enum: ['created', 'updated', 'reverted', 'deleted'] })
    kind: 'created' | 'updated' | 'reverted' | 'deleted';

    @ApiProperty({ example: '2026-03-28T12:00:00.000Z' })
    occurredAt: string;

    @ApiProperty({ type: () => ActorDto, required: false })
    actor?: ActorDto;

    @ApiProperty({ type: () => RevertInfoDto, required: false })
    revert?: RevertInfoDto;

    @ApiProperty({
        isArray: true,
        oneOf: [
            { $ref: getSchemaPath(ScalarChangeDto) },
            { $ref: getSchemaPath(AggregateChangeDto) },
            { $ref: getSchemaPath(ReferenceChangeDto) },
        ],
        discriminator: {
            propertyName: 'op',
            mapping: {
                scalar: getSchemaPath(ScalarChangeDto),
                aggregate: getSchemaPath(AggregateChangeDto),
                reference: getSchemaPath(ReferenceChangeDto),
            },
        },
    })
    changes: ChangeLogChangeDto[];
}
