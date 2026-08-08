import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { AppHttpException } from '../exceptions/app-http-exception';
import { ENTITY_NOT_FOUND } from '../exceptions/error_constants';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        const subdomain = this.extractSubdomain(req.headers['host']);
        if (!subdomain) {
            throw this.unrecognizedSubdomain(req.headers['host']);
        }

        const tenant = await this.tenantRepo.findOne({ where: { subdomain } });
        if (!tenant) {
            throw this.unrecognizedSubdomain(subdomain);
        }

        req['tenant'] = tenant;
        next();
    }

    private extractSubdomain(host: string | undefined): string | undefined {
        if (!host) {
            return undefined;
        }
        const hostname = host.split(':')[0];
        const parts = hostname.split('.');
        if (parts.length < 2) {
            return undefined;
        }
        return parts[0];
    }

    private unrecognizedSubdomain(hostOrSubdomain: string | undefined): AppHttpException {
        return new AppHttpException(
            'No tenant found for this subdomain',
            HttpStatus.NOT_FOUND,
            ENTITY_NOT_FOUND,
            { host: hostOrSubdomain },
        );
    }
}
