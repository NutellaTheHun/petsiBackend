import { ApiProperty } from '@nestjs/swagger';
import {
    AfterLoad,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { CreateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/create-dynamic-property-config.dto';
import { UpdateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/update-dynamic-property-config.dto';

export type DynamicPropertyConfigEntity = EntityBase<
    DynamicPropertyConfig,
    CreateDynamicPropertyConfigDto,
    UpdateDynamicPropertyConfigDto
>;

export enum HolderEntityType {
    MenuItem = 'menuItem',
}

export enum ValueType {
    EntityReference = 'entityReference',
    Filepath = 'filepath',
}

export type FieldRenderType = 'entity-select' | 'file-upload';

export function deriveFieldRenderType(valueType: ValueType): FieldRenderType {
    return valueType === ValueType.EntityReference ? 'entity-select' : 'file-upload';
}

@Unique(['holderEntityType', 'propertyName'])
@Entity()
export class DynamicPropertyConfig {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ enum: HolderEntityType })
    @Column({ type: 'enum', enum: HolderEntityType })
    holderEntityType: HolderEntityType;

    @ApiProperty({ type: () => MenuItemCategory, nullable: true })
    @ManyToOne(() => MenuItemCategory, { nullable: true, onDelete: 'SET NULL', eager: true })
    holderCategory: MenuItemCategory | null = null;

    @ApiProperty()
    @Column()
    propertyName: string;

    @ApiProperty({ enum: ValueType })
    @Column({ type: 'enum', enum: ValueType })
    valueType: ValueType;

    @ApiProperty({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    valueEntityType: string | null = null;

    @ApiProperty({ type: () => MenuItemCategory, nullable: true })
    @ManyToOne(() => MenuItemCategory, { nullable: true, onDelete: 'SET NULL', eager: true })
    valueEntityCategory: MenuItemCategory | null = null;

    @ApiProperty({ enum: ['entity-select', 'file-upload'] })
    fieldRenderType: FieldRenderType;

    @AfterLoad()
    computeFieldRenderType(): void {
        this.fieldRenderType = deriveFieldRenderType(this.valueType);
    }
}
