import { ChangeDetectorChange } from '../../../common/base/change-detector.base';
import {
    ActorDto,
    AggregateChangeDto,
    ChangeLogChangeDto,
    ChangeLogDto,
    ReferenceChangeDto,
    ScalarChangeDto,
} from '../dto/change-log.dto';

export const CHANGE_LOG_SCHEMA_VERSION = 1;

export type PersistedChangeLog = Omit<ChangeLogDto, 'changes'> & {
    changes: Array<
        | Omit<ScalarChangeDto, 'op'> & { op: 'scalar' }
        | Omit<AggregateChangeDto, 'op'> & { op: 'aggregate' }
        | Omit<ReferenceChangeDto, 'op'> & { op: 'reference' }
    >;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Map raw DB JSON to API DTO (validates minimal shape). */
export function persistedChangeLogToDto(raw: unknown): ChangeLogDto {
    if (!isPlainObject(raw)) {
        throw new Error('Invalid change_log: expected object');
    }
    const schemaVersion = Number(raw.schemaVersion);
    const kind = raw.kind;
    const occurredAt = String(raw.occurredAt ?? '');
    if (!Number.isFinite(schemaVersion) || typeof kind !== 'string' || !occurredAt) {
        throw new Error('Invalid change_log: missing required fields');
    }
    const changesRaw = Array.isArray(raw.changes) ? raw.changes : [];
    const changes: ChangeLogChangeDto[] = changesRaw.map((c) => {
        if (!isPlainObject(c) || typeof c.op !== 'string') {
            throw new Error('Invalid change_log.changes entry');
        }
        if (c.op === 'scalar') {
            return {
                op: 'scalar',
                path: String(c.path),
                from: c.from,
                to: c.to,
            } as ScalarChangeDto;
        }
        if (c.op === 'aggregate') {
            return {
                op: 'aggregate',
                path: String(c.path),
                added: Number(c.added ?? 0),
                removed: Number(c.removed ?? 0),
                modified: Boolean(c.modified ?? false),
            } as AggregateChangeDto;
        }
        if (c.op === 'reference') {
            return {
                op: 'reference',
                path: String(c.path),
                from: c.from as number | string | null | undefined,
                to: c.to as number | string | null | undefined,
                reason: c.reason !== undefined ? String(c.reason) : undefined,
            } as ReferenceChangeDto;
        }
        throw new Error(`Unknown change op: ${c.op}`);
    });

    let actor: ActorDto | undefined;
    if (isPlainObject(raw.actor) && typeof raw.actor.type === 'string') {
        actor = {
            type: raw.actor.type as ActorDto['type'],
            id:
                raw.actor.id !== undefined && raw.actor.id !== null
                    ? Number(raw.actor.id)
                    : undefined,
        };
    }

    let revert: { targetRevision: number } | undefined;
    if (isPlainObject(raw.revert) && raw.revert.targetRevision !== undefined) {
        revert = { targetRevision: Number(raw.revert.targetRevision) };
    }

    return {
        schemaVersion,
        kind: kind as ChangeLogDto['kind'],
        occurredAt,
        actor,
        revert,
        changes,
    };
}

export function buildCreatedChangeLog(actor?: ActorDto): PersistedChangeLog {
    return {
        schemaVersion: CHANGE_LOG_SCHEMA_VERSION,
        kind: 'created',
        occurredAt: new Date().toISOString(),
        actor,
        changes: [],
    };
}

export function buildRevertedChangeLog(
    targetRevision: number,
    actor?: ActorDto,
): PersistedChangeLog {
    return {
        schemaVersion: CHANGE_LOG_SCHEMA_VERSION,
        kind: 'reverted',
        occurredAt: new Date().toISOString(),
        actor,
        revert: { targetRevision },
        changes: [],
    };
}

/**
 * Maps detector output to persisted change_log changes[].
 * Collection paths get aggregate ops with counts when previous/next are id arrays.
 */
export function detectorChangesToPersistedChanges(
    changes: ChangeDetectorChange[],
): PersistedChangeLog['changes'] {
    const out: PersistedChangeLog['changes'] = [];
    for (const ch of changes) {
        if (ch.op === 'aggregate') {
            const agg = computeAggregateSummary(ch.previousValue, ch.nextValue);
            out.push({
                op: 'aggregate',
                path: ch.path,
                added: agg.added,
                removed: agg.removed,
                modified: true,
            });
            continue;
        }

        if (ch.op === 'reference' || ch.path === 'categoryId' || ch.path.endsWith('Id')) {
            out.push({
                op: 'reference',
                path: ch.path,
                from: ch.previousValue as number | string | null,
                to: ch.nextValue as number | string | null,
            });
            continue;
        }

        out.push({
            op: 'scalar',
            path: ch.path,
            from: serializeScalar(ch.previousValue),
            to: serializeScalar(ch.nextValue),
        });
    }
    return out;
}

function serializeScalar(v: unknown): unknown {
    if (v instanceof Date) return v.toISOString();
    return v;
}

function computeAggregateSummary(
    previousValue: unknown,
    nextValue: unknown,
): { added: number; removed: number } {
    const prevIds =
        Array.isArray(previousValue) &&
        previousValue.every((x) => typeof x === 'number')
            ? (previousValue as number[])
            : [];

    // Shape B: previousValue and nextValue are both number[] (e.g. sizeIds)
    if (Array.isArray(nextValue) && nextValue.every((x) => typeof x === 'number')) {
        const nextIds = nextValue as number[];
        const prevSet = new Set(prevIds);
        const nextSet = new Set(nextIds);
        const added = nextIds.filter((id) => !prevSet.has(id)).length;
        const removed = prevIds.filter((id) => !nextSet.has(id)).length;
        return { added, removed };
    }

    // Shape A: previousValue is number[] and nextValue is array of nested DTOs with {id}|{createId}
    if (!Array.isArray(nextValue)) {
        return { added: 0, removed: 0 };
    }

    let added = 0;
    const nextIdSet = new Set<number>();
    for (const item of nextValue) {
        if (isPlainObject(item) && 'createId' in item) {
            added += 1;
            continue;
        }
        if (isPlainObject(item) && typeof item.id === 'number') {
            nextIdSet.add(item.id);
        }
    }
    const removed = prevIds.filter((id) => !nextIdSet.has(id)).length;
    return { added, removed };
}

export function buildUpdatedChangeLog(
    detectorChanges: ChangeDetectorChange[],
    actor?: ActorDto,
): PersistedChangeLog {
    return {
        schemaVersion: CHANGE_LOG_SCHEMA_VERSION,
        kind: 'updated',
        occurredAt: new Date().toISOString(),
        actor,
        changes: detectorChangesToPersistedChanges(detectorChanges),
    };
}
