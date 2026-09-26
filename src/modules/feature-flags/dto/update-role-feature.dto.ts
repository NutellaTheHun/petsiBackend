/**
 * `RoleFeature` grants are added/removed, never edited in place — a role
 * either grants a feature (a row exists) or it doesn't (no row). This DTO
 * intentionally carries no fields; `RoleFeatureService.updateEntity` is a
 * no-op, and this type exists only to satisfy `ControllerBase`'s inherited
 * PUT route shape.
 */
export class UpdateRoleFeatureDto {}
