import { QueryFailedError } from "typeorm";
import { User } from "../modules/auth/entities/user.entities";
import { Role } from "../modules/auth/entities/role.entities";

export function isUser(value: any): value is User {
    return value instanceof User;
}
  
export function isQueryFailedError(value: any): value is QueryFailedError {
    return value instanceof QueryFailedError;
}

export function isRole(value: any): value is Role {
    return value instanceof User;
}