import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { RevisionEntityType } from '../constants/revision-entity-type';

@Entity('revision_history')
@Unique(['entityType', 'entityId', 'revisionNumber'])
@Index(['entityType', 'entityId', 'revisionNumber'])
export class RevisionHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 64, name: 'entity_type' })
    entityType: RevisionEntityType;

    @Column({ type: 'int', name: 'entity_id' })
    entityId: number;

    @Column({ type: 'int', name: 'revision_number' })
    revisionNumber: number;

    @Column({ type: 'jsonb', name: 'change_log' })
    changeLog: Record<string, unknown>;

    @Column({ type: 'jsonb' })
    payload: Record<string, unknown>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
