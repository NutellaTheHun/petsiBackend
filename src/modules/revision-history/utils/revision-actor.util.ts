import { RequestContextService } from '../../request-context/RequestContextService';
import { ActorDto } from '../dto/change-log.dto';

export function getRevisionActor(
    requestContextService: RequestContextService,
): ActorDto {
    const raw = requestContextService.get('userId');
    const userId =
        typeof raw === 'number' ? raw : raw != null ? Number(raw) : NaN;
    if (Number.isFinite(userId)) {
        return { type: 'user', id: userId };
    }
    return { type: 'system' };
}
