import { plainToInstance } from "class-transformer";
import { UpdateTenantDto } from "../../dto/update-tenant.dto";
import { Tenant } from "../../entities/tenant.entity";

export function tenantToUpdateDto(tenant: Tenant, merge: Partial<UpdateTenantDto> = {}): UpdateTenantDto {
    return plainToInstance(UpdateTenantDto, {
        name: tenant.name,
        subdomain: tenant.subdomain,
        ...merge,
    });
}
