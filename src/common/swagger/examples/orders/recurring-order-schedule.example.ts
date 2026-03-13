import { handleSetHas } from "../handlers/handlers";
import { orderExample } from "./order.example";

export function recurringOrderScheduleExample(fnSet: Set<string>, shallow: boolean) {
    fnSet.add(recurringOrderScheduleExample.name);
    return {
        id: 1,
        order: handleSetHas(shallow, fnSet, orderExample, true),
        rrule: 'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR',
        startDate: new Date(),
        endDate: new Date(),
    };
}