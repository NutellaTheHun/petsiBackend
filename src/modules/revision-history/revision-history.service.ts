import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RevisionEntityType } from './constants/revision-entity-type';
import { RevisionHistoryDetailDto } from './dto/revision-history-detail.dto';
import { RevisionHistoryListItemDto } from './dto/revision-history-list-item.dto';
import { RevisionHistory } from './entities/revision-history.entity';
import { persistedChangeLogToDto } from './utils/change-log-builder';

@Injectable()
export class RevisionHistoryService {
    constructor(
        @InjectRepository(RevisionHistory)
        private readonly repo: Repository<RevisionHistory>,
    ) {}

    async appendRevision(
        manager: EntityManager,
        params: {
            entityType: RevisionEntityType;
            entityId: number;
            changeLog: Record<string, unknown>;
            payload: Record<string, unknown>;
        },
    ): Promise<RevisionHistory> {
        const last = await manager.findOne(RevisionHistory, {
            where: {
                entityType: params.entityType,
                entityId: params.entityId,
            },
            order: { revisionNumber: 'DESC' },
        });
        const revisionNumber = (last?.revisionNumber ?? 0) + 1;
        const row = manager.create(RevisionHistory, {
            entityType: params.entityType,
            entityId: params.entityId,
            revisionNumber,
            changeLog: params.changeLog,
            payload: params.payload,
        });
        return manager.save(row);
    }

    /** Internal only: delete a revision row (e.g. future admin). */
    async removeRevisionById(id: number): Promise<void> {
        await this.repo.delete({ id });
    }

    async listRevisions(
        entityType: RevisionEntityType,
        entityId: number,
    ): Promise<RevisionHistoryListItemDto[]> {
        const rows = await this.repo.find({
            where: { entityType, entityId },
            order: { revisionNumber: 'DESC' },
        });
        return rows.map((r) => ({
            id: r.id,
            revisionNumber: r.revisionNumber,
            createdAt: r.createdAt,
            changeLog: persistedChangeLogToDto(r.changeLog),
        }));
    }

    async getRevisionOrThrow(
        entityType: RevisionEntityType,
        entityId: number,
        revisionNumber: number,
    ): Promise<RevisionHistoryDetailDto> {
        const row = await this.repo.findOne({
            where: { entityType, entityId, revisionNumber },
        });
        if (!row) {
            throw new NotFoundException(
                `Revision ${revisionNumber} not found for ${entityType} ${entityId}`,
            );
        }
        return {
            id: row.id,
            revisionNumber: row.revisionNumber,
            createdAt: row.createdAt,
            changeLog: persistedChangeLogToDto(row.changeLog),
            payload: row.payload,
        };
    }

    async getRevisionRow(
        entityType: RevisionEntityType,
        entityId: number,
        revisionNumber: number,
    ): Promise<RevisionHistory | null> {
        return this.repo.findOne({
            where: { entityType, entityId, revisionNumber },
        });
    }
}
