import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location } from '../entities/location.entity';

@Injectable()
export class LocationBuilder extends BuilderBase<Location> {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) {
        super(Location, 'LocationBuilder', requestContextService, logger);
    }

    protected createEntity(dto: CreateLocationDto): void {
        if (dto.tenantId !== undefined) {
            this.tenantById(dto.tenantId);
        }
        if (dto.name !== undefined) {
            this.locationName(dto.name);
        }
        if (dto.address !== undefined) {
            this.locationAddress(dto.address);
        }
        if (dto.phoneNumber !== undefined) {
            this.locationPhoneNumber(dto.phoneNumber);
        }
        if (dto.email !== undefined) {
            this.locationEmail(dto.email);
        }
    }

    protected updateEntity(dto: UpdateLocationDto): void {
        if (dto.tenantId !== undefined) {
            this.tenantById(dto.tenantId);
        }
        if (dto.name !== undefined) {
            this.locationName(dto.name);
        }
        if (dto.address !== undefined) {
            this.locationAddress(dto.address);
        }
        if (dto.phoneNumber !== undefined) {
            this.locationPhoneNumber(dto.phoneNumber);
        }
        if (dto.email !== undefined) {
            this.locationEmail(dto.email);
        }
    }

    public tenantById(id: number): this {
        return this.setPropById(
            async (id: number) => await this.tenantRepo.findOne({ where: { id } }),
            'tenant',
            id,
        );
    }

    public locationName(name: string): this {
        return this.setPropByVal('name', name);
    }

    public locationAddress(address: string): this {
        return this.setPropByVal('address', address);
    }

    public locationPhoneNumber(phoneNumber: string): this {
        return this.setPropByVal('phoneNumber', phoneNumber);
    }

    public locationEmail(email: string): this {
        return this.setPropByVal('email', email);
    }
}
