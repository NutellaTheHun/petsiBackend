import { BuilderBase } from '../../../common/base/builder.base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Tenant } from '../entities/tenant.entity';

export class TenantBuilder extends BuilderBase<Tenant> {
    constructor(requestContextService: RequestContextService) {
        super(Tenant, 'TenantBuilder', requestContextService);
    }

    protected createEntity(dto: CreateTenantDto): void {
        if (dto.name !== undefined) {
            this.tenantName(dto.name);
        }
        if (dto.subdomain !== undefined) {
            this.tenantSubdomain(dto.subdomain);
        }
    }

    protected updateEntity(dto: UpdateTenantDto): void {
        if (dto.name !== undefined) {
            this.tenantName(dto.name);
        }
        if (dto.subdomain !== undefined) {
            this.tenantSubdomain(dto.subdomain);
        }
    }

    public tenantName(name: string): this {
        return this.setPropByVal('name', name);
    }

    public tenantSubdomain(subdomain: string): this {
        return this.setPropByVal('subdomain', subdomain);
    }
}
