import { UpdateUserDto } from "../../dto/update-user.dto";
import { User } from "../../entities/user.entities";

export function userToUpdateDto(user: User): UpdateUserDto {
    return {
        name: user.name,
        password: user.password,
        email: user.email ?? null,
        roleIds: user.roles.map(role => role.id),
    };
}