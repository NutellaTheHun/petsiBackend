import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId, Unique } from 'typeorm';
import {
    DynamicPropertyConfig,
} from '../../dynamic-properties/entities/dynamic-property-config.entity';
import { MenuItem } from './menu-item.entity';

@Unique(['menuItem', 'config'])
@Entity()
export class MenuItemDynamicPropertyValue {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MenuItem, { nullable: false, onDelete: 'CASCADE' })
    menuItem: MenuItem;

    @ManyToOne(() => DynamicPropertyConfig, {
        nullable: false,
        onDelete: 'CASCADE',
        eager: true,
    })
    config: DynamicPropertyConfig;

    @Column({ type: 'varchar', nullable: true })
    valueText: string | null = null;

    @ManyToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
    valueEntity: MenuItem | null = null;

    @RelationId((dpv: MenuItemDynamicPropertyValue) => dpv.valueEntity)
    valueEntityId: number | null;
}
