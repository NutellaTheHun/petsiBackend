import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { REVISION_ENTITY_TYPES, RevisionEntityType } from '../constants/revision-entity-type';
import { RevisionHistory } from '../entities/revision-history.entity';
import { RevisionHistoryRetentionPolicyService } from './revision-history-retention-policy.service';

type PruneRunResult = {
    scannedEntityGroups: number;
    candidateRows: number;
    deletedRows: number;
    dryRun: boolean;
};

@Injectable()
export class RevisionHistoryPrunerService {
    private readonly context = 'RevisionHistoryPrunerService';
    private readonly logger = new Logger(RevisionHistoryPrunerService.name);

    constructor(
        @InjectRepository(RevisionHistory)
        private readonly repo: Repository<RevisionHistory>,
        private readonly policyService: RevisionHistoryRetentionPolicyService,
    ) {}

    /**
     * Nightly off-peak pruning of revision_history.
     *
     * Safety knobs:
     * - disabled via REVISION_HISTORY_PRUNE_ENABLED
     * - dry-run via REVISION_HISTORY_PRUNE_DRY_RUN (logs only)
     * - batch limited via REVISION_HISTORY_PRUNE_BATCH_LIMIT
     *
     * Retention semantics:
     * - revision 1 is ALWAYS retained and does not count toward maxRevisionsExcludingCreate
     * - deletion requires BOTH:
     *   (a) older than minAgeDays AND
     *   (b) outside newest-N window (computed ignoring rev 1)
     */
    @Cron('0 3 * * *')
    async handleCron(): Promise<void> {
        const enabledAny = this.anyEntityPruningEnabled();
        if (!enabledAny) return;

        const startedAt = Date.now();
        const result = await this.runOnce();
        const ms = Date.now() - startedAt;
        this.logger.log(
            `${this.context}: completed pruning run in ${ms}ms: ${JSON.stringify(
                result,
            )}`,
        );
    }

    /**
     * Runs one pruning cycle across all supported entity types.
     * Exposed for tests and for potential manual invocations.
     */
    async runOnce(): Promise<PruneRunResult> {
        const entityTypes: RevisionEntityType[] = [
            REVISION_ENTITY_TYPES.ORDER,
            REVISION_ENTITY_TYPES.MENU_ITEM,
        ];

        let scannedEntityGroups = 0;
        let candidateRows = 0;
        let deletedRows = 0;
        let dryRun = true;

        for (const entityType of entityTypes) {
            const policy = this.policyService.getPolicy(entityType);
            if (!policy.enabled) continue;
            dryRun = dryRun && policy.dryRun;

            const { scanned, candidates, deleted } =
                await this.pruneEntityType(entityType, policy);
            scannedEntityGroups += scanned;
            candidateRows += candidates;
            deletedRows += deleted;
        }

        return { scannedEntityGroups, candidateRows, deletedRows, dryRun };
    }

    private anyEntityPruningEnabled(): boolean {
        const entityTypes: RevisionEntityType[] = [
            REVISION_ENTITY_TYPES.ORDER,
            REVISION_ENTITY_TYPES.MENU_ITEM,
        ];
        return entityTypes.some((t) => this.policyService.getPolicy(t).enabled);
    }

    private async pruneEntityType(
        entityType: RevisionEntityType,
        policy: {
            dryRun: boolean;
            batchLimit: number;
            maxRevisionsExcludingCreate: number;
            minAgeDays: number;
        },
    ): Promise<{ scanned: number; candidates: number; deleted: number }> {
        const cutoff = new Date(Date.now() - policy.minAgeDays * 24 * 60 * 60 * 1000);

        // Find all entityIds that have old revisions (excluding rev 1) – keeps scanning bounded.
        const groups = await this.repo
            .createQueryBuilder('rh')
            .select('rh.entity_id', 'entityId')
            .addSelect('MAX(rh.revision_number)', 'headRev')
            .where('rh.entity_type = :entityType', { entityType })
            .andWhere('rh.revision_number != 1')
            .groupBy('rh.entity_id')
            .getRawMany<{ entityId: number; headRev: string }>();

        let scanned = 0;
        let candidates = 0;
        let deleted = 0;
        let remainingBudget = policy.batchLimit;

        for (const g of groups) {
            if (remainingBudget <= 0) break;
            scanned += 1;

            const entityId = Number(g.entityId);
            const headRev = Number(g.headRev);
            if (!Number.isFinite(entityId) || !Number.isFinite(headRev)) continue;

            const keepFrom = Math.max(2, headRev - policy.maxRevisionsExcludingCreate + 1);

            // Only delete revisions older than cutoff AND outside keep window AND not revision 1.
            const toDelete = await this.repo.find({
                select: ['id'],
                where: {
                    entityType,
                    entityId,
                    revisionNumber: LessThan(keepFrom),
                    createdAt: LessThan(cutoff),
                },
                order: { revisionNumber: 'ASC' },
                take: remainingBudget,
            });

            if (!toDelete.length) continue;
            candidates += toDelete.length;

            const ids = toDelete.map((r) => r.id);
            if (policy.dryRun) {
                this.logger.log(
                    `${this.context}: dry-run candidates entityType=${entityType} entityId=${entityId} headRev=${headRev} keepFrom=${keepFrom} cutoff=${cutoff.toISOString()} wouldDeleteCount=${ids.length} sampleIds=${ids
                        .slice(0, 10)
                        .join(',')}`,
                );
            } else {
                await this.repo.delete({ id: In(ids) });
                deleted += ids.length;
                remainingBudget -= ids.length;
            }
        }

        return { scanned, candidates, deleted };
    }
}

