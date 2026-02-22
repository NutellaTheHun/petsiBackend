import { plainToInstance } from "class-transformer";
import { UpdateRoleDto } from "../../dto/update-role.dto";
import { Role } from "../../entities/role.entity";

export function roleToUpdateDto(role: Role): UpdateRoleDto {
    return plainToInstance(UpdateRoleDto, {
        name: role.name,
    });
}