import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareConnectionStatusDto } from '../dto/square-connection-status.dto';
import { SquareConnection } from '../entities/square-connection.entity';

/**
 * Reads and writes the tenant's `SquareConnection`. Not a `ServiceBase`: the
 * connection is written by the OAuth flow and read on the webhook path (no
 * request context), never through generic CRUD, so methods that can run
 * without a request take the tenant id explicitly.
 */
@Injectable()
export class SquareConnectionService {
    constructor(
        @InjectRepository(SquareConnection)
        private readonly connectionRepo: Repository<SquareConnection>,
        private readonly requestContextService: RequestContextService,
    ) {}

    async findByTenant(tenantId: number): Promise<SquareConnection | null> {
        return this.connectionRepo.findOne({ where: { tenantId } });
    }

    async getStatusForCurrentTenant(): Promise<SquareConnectionStatusDto> {
        const connection = await this.findByTenant(this.getTenantId());
        if (!connection) {
            return { status: 'not_connected', businessName: null };
        }
        return {
            status: connection.status,
            businessName: connection.businessName,
        };
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
