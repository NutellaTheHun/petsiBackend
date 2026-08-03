import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';

export type SettingEntity = EntityBase<Setting, CreateSettingDto, UpdateSettingDto>;

export enum SettingValueType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Json = 'json',
}

/**
 * A single named configuration value for a Tenant, optionally overridden at
 * one of its Locations. `locationId: null` is the tenant-wide default row;
 * a non-null `locationId` is a location-specific override of that same
 * `name`. Because Postgres treats every NULL as distinct, a plain composite
 * unique constraint on (tenantId, locationId, name) would let duplicate
 * tenant-default rows through — two partial unique indexes are used instead,
 * one scoped to the NULL-location case and one to the non-NULL case.
 */
@Entity()
@Index('UQ_setting_tenant_default_name', ['tenantId', 'name'], {
    unique: true,
    where: '"locationId" IS NULL',
})
@Index('UQ_setting_tenant_location_name', ['tenantId', 'locationId', 'name'], {
    unique: true,
    where: '"locationId" IS NOT NULL',
})
export class Setting {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this setting belongs to. Denormalized scalar column (not a
     * relation) so ServiceBase-level tenant filtering never needs a join.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    /**
     * The Location this setting overrides for. `null` means this row is the
     * tenant-wide default for `name`.
     */
    @ApiProperty({
        example: 1,
        description: 'The Location this setting overrides, or null for the tenant-wide default',
        nullable: true,
    })
    @Column({ type: 'int', nullable: true })
    locationId: number | null;

    /**
     * The setting key, validated at write time against the backend
     * `SettingKey` registry.
     */
    @ApiProperty({ example: 'taxRate', description: 'The setting key' })
    @Column()
    name: string;

    @ApiProperty({ enum: SettingValueType, description: 'The declared type of `value`' })
    @Column({ type: 'enum', enum: SettingValueType })
    valueType: SettingValueType;

    /**
     * Always stored as text; serialized/deserialized per `valueType` by
     * `serializeSettingValue`/`deserializeSettingValue`. Never parse this
     * column directly outside those helpers.
     */
    @ApiProperty({ example: '0.08', description: 'The raw stored value, serialized per valueType' })
    @Column({ type: 'text' })
    value: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
