import { RequestContextService } from '../../request-context/RequestContextService';
import { ActorDto } from '../dto/change-log.dto';

export function getRevisionActor(
    requestContextService: RequestContextService,
): ActorDto {
    if (
        requestContextService.get<unknown>('revisionActorType') ===
        'square_webhook'
    ) {
        return { type: 'square_webhook' };
    }
    const raw = requestContextService.get<unknown>('userId');
    const userId =
        typeof raw === 'number' ? raw : raw != null ? Number(raw) : NaN;
    if (Number.isFinite(userId)) {
        return { type: 'user', id: userId };
    }
    return { type: 'system' };
}
