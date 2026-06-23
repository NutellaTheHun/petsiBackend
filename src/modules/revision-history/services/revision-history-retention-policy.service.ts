import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RevisionEntityType } from '../constants/revision-entity-type';

export type RevisionHistoryRetentionPolicy = {
    /**
     * Enables the pruning cron job. When disabled, the cron will exit early.
     */
    enabled: boolean;
    /**
     * When true, the pruner only logs what would be deleted.
     */
    dryRun: boolean;
    /**
     * Maximum number of revisions to keep per entity, excluding revision 1.
     * Revision 1 is always retained and does not count toward this value.
     */
    maxRevisionsExcludingCreate: number;
    /**
     * Minimum age (in days) before a revision can be deleted.
     * Pruning requires BOTH: (a) older than this age AND (b) outside keep window.
     */
    minAgeDays: number;
    /**
     * Hard cap on how many revision_history rows may be deleted in one run.
     * This bounds DB load and makes the job predictable.
     */
    batchLimit: number;
};

@Injectable()
export class RevisionHistoryRetentionPolicyService {
    constructor(private readonly configService: ConfigService) { }

    /**
     * Returns the effective retention policy for a given entityType using:
     * - global defaults, then
     * - optional per-entity overrides.
     *
     * Env keys (global):
     * - REVISION_HISTORY_PRUNE_ENABLED
     * - REVISION_HISTORY_PRUNE_DRY_RUN
     * - REVISION_HISTORY_PRUNE_BATCH_LIMIT
     * - REVISION_HISTORY_MAX_REVISIONS
     * - REVISION_HISTORY_MIN_AGE_DAYS
     *
     * Env keys (per entityType), where entityType is uppercased (e.g. ORDER, MENU_ITEM):
     * - REVISION_HISTORY_<ENTITY>_MAX_REVISIONS
     * - REVISION_HISTORY_<ENTITY>_MIN_AGE_DAYS
     */
    getPolicy(entityType: RevisionEntityType): RevisionHistoryRetentionPolicy {
        const enabled = this.getBool('REVISION_HISTORY_PRUNE_ENABLED', false);
        const dryRun = this.getBool('REVISION_HISTORY_PRUNE_DRY_RUN', true);
        const batchLimit = this.getInt(
            'REVISION_HISTORY_PRUNE_BATCH_LIMIT',
            5000,
        );

        const globalMax = this.getInt('REVISION_HISTORY_MAX_REVISIONS', 10);
        const globalMinAge = this.getInt('REVISION_HISTORY_MIN_AGE_DAYS', 30);

        const typeKey = entityType.toUpperCase(); // order -> ORDER, menu_item -> MENU_ITEM
        const maxRevisionsExcludingCreate = this.getInt(
            `REVISION_HISTORY_${typeKey}_MAX_REVISIONS`,
            globalMax,
        );
        const minAgeDays = this.getInt(
            `REVISION_HISTORY_${typeKey}_MIN_AGE_DAYS`,
            globalMinAge,
        );

        return {
            enabled,
            dryRun,
            batchLimit: Math.max(1, batchLimit),
            maxRevisionsExcludingCreate: Math.max(0, maxRevisionsExcludingCreate),
            minAgeDays: Math.max(0, minAgeDays),
        };
    }

    private getBool(key: string, defaultValue: boolean): boolean {
        const raw = this.configService.get<string | boolean | number | undefined>(
            key,
        );
        if (raw === undefined || raw === null) return defaultValue;
        if (typeof raw === 'boolean') return raw;
        if (typeof raw === 'number') return raw !== 0;
        const v = String(raw).trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes' || v === 'y') return true;
        if (v === 'false' || v === '0' || v === 'no' || v === 'n') return false;
        return defaultValue;
    }

    private getInt(key: string, defaultValue: number): number {
        const raw = this.configService.get<string | number | undefined>(key);
        if (raw === undefined || raw === null) return defaultValue;
        const n = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(n) ? Math.trunc(n) : defaultValue;
    }
}

