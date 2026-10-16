import { Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location } from '../entities/location.entity';

@Injectable()
export class LocationBuilder extends BuilderBase<Location> {
    constructor(
        requestContextService: RequestContextService,
    ) {
        super(Location, 'LocationBuilder', requestContextService);
    }

    protected createEntity(dto: CreateLocationDto): void {
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
