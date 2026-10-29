import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareNotFoundException } from '../client/square-error-boundary';
import { SquareOrderIssueDto } from '../dto/square-order-issue.dto';
import {
    SQUARE_RETRYABLE_ISSUE_REASONS,
    SquareOrderIssue,
    SquareOrderIssueStatus,
} from '../entities/square-order-issue.entity';
import { SquareConnectionService } from './square-connection.service';
import { SquareLocationImportService } from './square-location-import.service';
import { SquareOrderIngestService } from './square-order-ingest.service';

/**
 * Staff actions on order issues at one Petsi location: list, retry, dismiss.
 * `RoleGuard` authorizes the caller for the route's `locationId`; every
 * method then scopes to the caller's tenant and that location, so an issue
 * elsewhere is a 404. Issues are written only by `SquareOrderIngestService`.
 */
@Injectable()
export class SquareOrderIssueService {
    constructor(
        @InjectRepository(SquareOrderIssue)
        private readonly issueRepo: Repository<SquareOrderIssue>,
        private readonly importService: SquareLocationImportService,
        private readonly connectionService: SquareConnectionService,
        private readonly ingest: SquareOrderIngestService,
        private readonly requestContextService: RequestContextService,
    ) {}

    async findAllForCurrentTenant(
        locationId: number,
        status: SquareOrderIssueStatus,
    ): Promise<SquareOrderIssueDto[]> {
        const issues = await this.issueRepo.find({
            where: { tenantId: this.getTenantId(), locationId, status },
            order: { lastAttemptAt: 'DESC', id: 'DESC' },
        });
        return issues.map(toDto);
    }

    /**
     * Re-fetches the order from Square and ingests it as the caller. Success
     * resolves the issue; another rejection keeps it open with the new
     * attempt's detail. Only open, retryable issues can be retried.
     */
    async retryForCurrentTenant(
        locationId: number,
        id: number,
    ): Promise<SquareOrderIssueDto> {
        const issue = await this.findIssueOrThrow(locationId, id);
        const errorMap = new ValidationErrorMap(issue.id);
        if (issue.status !== 'open') {
            errorMap.addError('INCONSISTENT_STATE', undefined, ['status']);
        } else if (!SQUARE_RETRYABLE_ISSUE_REASONS.includes(issue.reason)) {
            errorMap.addError('INCONSISTENT_STATE', undefined, ['reason']);
        }
        if (!errorMap.isEmpty()) {
            throw new ValidationException(errorMap);
        }

        const connection = await this.importService.requireConnection(
            issue.tenantId,
        );
        const { order } = await this.connectionService.callTenant(
            connection,
            (api) => api.orders.get({ orderId: issue.squareOrderId }),
        );
        if (!order) {
            throw new SquareNotFoundException();
        }
        await this.ingest.ingest(connection, order, {
            actorUserId: this.requestContextService.get<number>('userId'),
        });
        return toDto(await this.issueRepo.findOneByOrFail({ id: issue.id }));
    }

    /** Staff have dealt with it outside Petsi. Dismissing twice is a no-op. */
    async dismissForCurrentTenant(
        locationId: number,
        id: number,
    ): Promise<SquareOrderIssueDto> {
        const issue = await this.findIssueOrThrow(locationId, id);
        if (issue.status === 'resolved') {
            const errorMap = new ValidationErrorMap(issue.id);
            errorMap.addError('INCONSISTENT_STATE', undefined, ['status']);
            throw new ValidationException(errorMap);
        }
        await this.issueRepo.update({ id: issue.id }, { status: 'dismissed' });
        return toDto(await this.issueRepo.findOneByOrFail({ id: issue.id }));
    }

    private async findIssueOrThrow(
        locationId: number,
        id: number,
    ): Promise<SquareOrderIssue> {
        const issue = await this.issueRepo.findOne({
            where: { id, tenantId: this.getTenantId(), locationId },
        });
        if (!issue) {
            throw new NotFoundException();
        }
        return issue;
    }

    /** The caller's tenant, from the request context; never a client-supplied id. */
    private getTenantId(): number {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        return tenantId;
    }
}

function toDto(issue: SquareOrderIssue): SquareOrderIssueDto {
    return {
        id: issue.id,
        squareOrderId: issue.squareOrderId,
        squareLocationId: issue.squareLocationId,
        locationId: issue.locationId,
        orderId: issue.orderId,
        squareVersion: issue.squareVersion,
        reason: issue.reason,
        detail: issue.detail,
        status: issue.status,
        lastAttemptAt: issue.lastAttemptAt,
        createdAt: issue.createdAt,
    };
}
