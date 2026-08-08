import { plainToInstance } from "class-transformer";
import { UpdateLocationDto } from "../../dto/update-location.dto";
import { Location } from "../../entities/location.entity";

export function locationToUpdateDto(location: Location, merge: Partial<UpdateLocationDto> = {}): UpdateLocationDto {
    return plainToInstance(UpdateLocationDto, {
        tenantId: location.tenant.id,
        name: location.name,
        address: location.address ?? undefined,
        phoneNumber: location.phoneNumber ?? undefined,
        email: location.email ?? undefined,
        ...merge,
    });
}
