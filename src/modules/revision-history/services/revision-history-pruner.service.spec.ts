import { ConfigModule } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { RevisionHistoryModule } from '../revision-history.module';
import { RevisionHistory } from '../entities/revision-history.entity';
import { REVISION_ENTITY_TYPES } from '../constants/revision-entity-type';
import { RevisionHistoryPrunerService } from './revision-history-pruner.service';

describe('RevisionHistoryPrunerService', () => {
    let module: TestingModule;
    let dataSource: DataSource;
    let repo: Repository<RevisionHistory>;
    let pruner: RevisionHistoryPrunerService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeORMPostgresTestingModule([RevisionHistory]),
                RevisionHistoryModule,
            ],
        }).compile();

        dataSource = module.get(DataSource);
        repo = module.get(getRepositoryToken(RevisionHistory));
        pruner = module.get(RevisionHistoryPrunerService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await repo.clear();
        process.env.REVISION_HISTORY_PRUNE_ENABLED = 'true';
        process.env.REVISION_HISTORY_PRUNE_DRY_RUN = 'false';
        process.env.REVISION_HISTORY_PRUNE_BATCH_LIMIT = '5000';
        process.env.REVISION_HISTORY_MAX_REVISIONS = '10';
        process.env.REVISION_HISTORY_MIN_AGE_DAYS = '30';
    });

    it('dry-run does not delete rows', async () => {
        process.env.REVISION_HISTORY_PRUNE_DRY_RUN = 'true';
        await seedRevisions({
            entityType: REVISION_ENTITY_TYPES.ORDER,
            entityId: 1001,
            count: 15,
            backdateBeforeRevision: 5,
            backdateDays: 60,
        });

        const before = await repo.count({
            where: { entityType: REVISION_ENTITY_TYPES.ORDER, entityId: 1001 },
        });
        await pruner.runOnce();
        const after = await repo.count({
            where: { entityType: REVISION_ENTITY_TYPES.ORDER, entityId: 1001 },
        });
        expect(after).toEqual(before);
    });

    it('deletes only revisions outside newest X window AND older than Y days, retaining revision 1', async () => {
        process.env.REVISION_HISTORY_MAX_REVISIONS = '10';
        process.env.REVISION_HISTORY_MIN_AGE_DAYS = '30';

        const entityType = REVISION_ENTITY_TYPES.ORDER;
        const entityId = 2001;
        await seedRevisions({
            entityType,
            entityId,
            count: 15,
            backdateBeforeRevision: 5,
            backdateDays: 60,
        });

        await pruner.runOnce();

        const remaining = await repo.find({
            where: { entityType, entityId },
            order: { revisionNumber: 'ASC' },
        });
        const remainingRevs = remaining.map((r) => r.revisionNumber);

        // Always keep create revision 1
        expect(remainingRevs).toContain(1);

        // Head is 15; keep newest 10 excluding rev1 => keep revs 6..15 plus rev1.
        for (let rev = 6; rev <= 15; rev++) {
            expect(remainingRevs).toContain(rev);
        }

        // Old and outside window: revs 2..5 should be deleted (we backdated them)
        for (let rev = 2; rev <= 5; rev++) {
            expect(remainingRevs).not.toContain(rev);
        }
    });

    it('respects batch limit (deletes at most N rows per run)', async () => {
        process.env.REVISION_HISTORY_MAX_REVISIONS = '2';
        process.env.REVISION_HISTORY_MIN_AGE_DAYS = '1';
        process.env.REVISION_HISTORY_PRUNE_BATCH_LIMIT = '2';

        const entityType = REVISION_ENTITY_TYPES.ORDER;
        const entityId = 3001;
        await seedRevisions({
            entityType,
            entityId,
            count: 8,
            backdateBeforeRevision: 6,
            backdateDays: 10,
        });

        const before = await repo.count({ where: { entityType, entityId } });
        await pruner.runOnce();
        const after = await repo.count({ where: { entityType, entityId } });

        // At most 2 rows deleted this run (rev1 never deleted)
        expect(before - after).toBeLessThanOrEqual(2);
        expect(before - after).toBeGreaterThan(0);
    });

    async function seedRevisions(params: {
        entityType: string;
        entityId: number;
        count: number;
        backdateBeforeRevision: number;
        backdateDays: number;
    }): Promise<void> {
        const rows: Partial<RevisionHistory>[] = [];
        for (let rev = 1; rev <= params.count; rev++) {
            rows.push({
                entityType: params.entityType as any,
                entityId: params.entityId,
                revisionNumber: rev,
                changeLog: {
                    schemaVersion: 1,
                    kind: rev === 1 ? 'created' : 'updated',
                    occurredAt: new Date().toISOString(),
                    changes: [],
                },
                payload: { payloadVersion: 1, rev },
            });
        }

        await repo.save(rows as any);

        const cutoff = new Date(
            Date.now() - params.backdateDays * 24 * 60 * 60 * 1000,
        );

        // Backdate revisions 2..backdateBeforeRevision (rev1 stays recent to prove it is retained regardless).
        await dataSource
            .createQueryBuilder()
            .update(RevisionHistory)
            .set({ createdAt: cutoff })
            .where('entity_type = :entityType', { entityType: params.entityType })
            .andWhere('entity_id = :entityId', { entityId: params.entityId })
            .andWhere('revision_number BETWEEN 2 AND :maxRev', {
                maxRev: params.backdateBeforeRevision,
            })
            .execute();
    }
});

