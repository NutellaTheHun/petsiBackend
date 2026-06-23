export interface ChangeDetectorChange {
    /**
     * Operation type used to map changes into revision-history change_log entries.
     *
     * - scalar: scalar property change (strings, numbers, booleans, dates, etc.)
     * - reference: reference/FK-like change (ids, nullable ids, or reference DTO patches)
     * - aggregate: authoritative nested collections (nested DTO arrays or id arrays)
     */
    op: 'scalar' | 'reference' | 'aggregate';
    path: string;
    previousValue: unknown;
    nextValue: unknown;
}

export interface ChangeDetectionResult<TUpdateDto extends object> {
    patch: Partial<TUpdateDto>;
    hasChanges: boolean;
    changes: ChangeDetectorChange[];
}

export type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};

export type MutablePartial<T extends object> = Partial<Mutable<T>>;

export abstract class ChangeDetectorBase<TEntity, TUpdateDto extends object> {
    public abstract detect(
        entity: TEntity,
        dto: TUpdateDto,
    ): ChangeDetectionResult<TUpdateDto>;

    protected unchanged<T>(currentValue: T, incomingValue: T): boolean {
        return currentValue === incomingValue;
    }

    protected sameDate(
        currentValue?: Date | string | null,
        incomingValue?: Date | string | null,
    ): boolean {
        if (currentValue == null && incomingValue == null) {
            return true;
        }

        if (currentValue == null || incomingValue == null) {
            return false;
        }

        const currentMs = new Date(currentValue).getTime();
        const incomingMs = new Date(incomingValue).getTime();

        return Number.isFinite(currentMs) &&
            Number.isFinite(incomingMs) &&
            currentMs === incomingMs;
    }

    protected sameNumberArray(
        currentValues?: number[] | null,
        incomingValues?: number[] | null,
    ): boolean {
        if (!currentValues?.length && !incomingValues?.length) {
            return true;
        }

        if (!currentValues || !incomingValues) {
            return false;
        }

        if (currentValues.length !== incomingValues.length) {
            return false;
        }

        for (let i = 0; i < currentValues.length; i += 1) {
            if (currentValues[i] !== incomingValues[i]) {
                return false;
            }
        }

        return true;
    }
}
