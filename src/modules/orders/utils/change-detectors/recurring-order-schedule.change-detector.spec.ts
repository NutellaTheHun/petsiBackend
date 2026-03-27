import { RecurringOrderSchedule } from '../../entities/recurring-order-schedule.entity';
import { recurringOrderScheduleToNestedUpdateDto } from '../entity-transformers/recurring-order-schedule.dto.transformer';
import { RecurringOrderScheduleChangeDetector } from './recurring-order-schedule.change-detector';

/** Minimal valid RRULE used by parseRruleString in entity transformers */
const RRULE_WEEKLY_MO = 'DTSTART:20120201T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO';

describe('RecurringOrderScheduleChangeDetector', () => {
    const detector = new RecurringOrderScheduleChangeDetector();

    const baseEntity = (): RecurringOrderSchedule =>
        ({
            id: 1,
            rrule: RRULE_WEEKLY_MO,
            startDate: new Date('2012-02-01T09:30:00.000Z'),
        } as RecurringOrderSchedule);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recurringOrderScheduleToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects frequency change', () => {
        const entity = baseEntity();
        const dto = recurringOrderScheduleToNestedUpdateDto(entity, { frequency: 'DAILY' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.frequency).toBe('DAILY');
    });
});
