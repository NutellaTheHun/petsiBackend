import { UpdateRoleDto } from "../../dto/update-role.dto";
import { Role } from "../../entities/role.entity";

export function roleToUpdateDto(role: Role): UpdateRoleDto {
    return {
        name: role.name,
    };
}