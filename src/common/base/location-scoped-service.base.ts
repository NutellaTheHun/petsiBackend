import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { EntityBase } from './entity.base';
import { TenantScopedServiceBase } from './tenant-scoped-service.base';

/**
 * Sits between `TenantScopedServiceBase` and a domain's concrete
 * `ServiceBase` subclass for location-bound (operational) entities. Same
 * deliberate exception as `TenantScopedServiceBase` to the "domain services
 * only touch lifecycle hooks" rule (see src/common/base/CLAUDE.md) — this
 * class also overrides the concrete CRUD methods, layering location
 * authorization on top of the inherited tenant scoping.
 *
 * Two distinct failure modes, matching how `TenantScopedServiceBase` treats
 * tenant mismatches:
 * - Reading/mutating an *existing* entity at a location the caller isn't
 *   assigned to behaves like the entity doesn't exist (`NotFoundException`),
 *   same reasoning as the tenant case.
 * - Targeting a locationId the caller chose explicitly (on create, or moving
 *   an entity to a different location on update) is a `ForbiddenException`
 *   instead — the caller isn't confused about whether the location exists
 *   (Location is tenant-wide-readable catalog data), they're just not
 *   authorized to act there.
 *
 * A domain service extending this only needs to: add `tenantId`/`locationId`
 * columns to its entity, stamp them via `this.getTenantId()`/`dto.locationId`
 * inside `createEntity`, and change `extends ServiceBase<X>` to
 * `extends LocationScopedServiceBase<X>` — no constructor changes required.
 */
export abstract class LocationScopedServiceBase<
  TEntity extends EntityBase<any, any, any>,
> extends TenantScopedServiceBase<TEntity> {
  protected isTenantAdmin(): boolean {
    return this.requestContextService.get<boolean>('isTenantAdmin') === true;
  }

  protected getAuthorizedLocationIds(): number[] {
    const locations =
      this.requestContextService.get<{ locationId: number; roles: string[] }[]>(
        'locations',
      ) ?? [];
    return locations.map((l) => l.locationId);
  }

  /**
   * A tenant-wide admin is authorized for every location under the tenant
   * without a per-location `UserLocation` assignment row.
   */
  protected isLocationAuthorized(locationId: number): boolean {
    return (
      this.isTenantAdmin() || this.getAuthorizedLocationIds().includes(locationId)
    );
  }

  protected assertLocationAuthorized(locationId: number): void {
    if (!this.isLocationAuthorized(locationId)) {
      throw new ForbiddenException();
    }
  }

  async create(createDto: any): Promise<TEntity['__Entity']> {
    this.assertLocationAuthorized(createDto?.locationId);
    return super.create(createDto);
  }

  async update(id: number, updateDto: any): Promise<TEntity['__Entity']> {
    if (updateDto?.locationId != null) {
      this.assertLocationAuthorized(updateDto.locationId);
    }
    return super.update(id, updateDto);
  }

  async findOne(
    id: number,
    relations?: string[],
  ): Promise<TEntity['__Entity']> {
    const entity = await super.findOne(id, relations); // already tenant-scoped
    if (!this.isLocationAuthorized((entity as any).locationId)) {
      throw new NotFoundException();
    }
    return entity;
  }

  protected applyScope(
    query: SelectQueryBuilder<TEntity['__Entity']>,
    options?: { locationId?: number },
  ): void {
    super.applyScope(query, options);

    if (options?.locationId != null) {
      this.assertLocationAuthorized(options.locationId);
      query.andWhere('entity.locationId = :locationId', {
        locationId: options.locationId,
      });
      return;
    }

    if (!this.isTenantAdmin()) {
      const locationIds = this.getAuthorizedLocationIds();
      if (locationIds.length === 0) {
        query.andWhere('1 = 0');
      } else {
        query.andWhere('entity.locationId IN (:...locationIds)', {
          locationIds,
        });
      }
    }
  }

  /**
   * Results vary not just by tenant but by which locations the caller is
   * authorized for (an unscoped `findAll`/`findOne` implicitly filters to
   * the caller's location set — see `applyScope` above), so the cache key
   * must fold that in too, or two callers in the same tenant with different
   * location assignments could be served each other's cached results.
   */
  public getCacheScope(): string {
    const tenantScope = super.getCacheScope();
    if (this.isTenantAdmin()) {
      return `${tenantScope}|admin`;
    }
    const locationIds = [...this.getAuthorizedLocationIds()].sort(
      (a, b) => a - b,
    );
    return `${tenantScope}|locations:${locationIds.join(',')}`;
  }

  /**
   * Unlike `getCacheScope()`, invalidation deliberately drops the location
   * component: a create/update/remove at one location must invalidate the
   * `findAll` cache for every location-view variant within the tenant, not
   * just the writer's own. Falls back to the tenant-only scope from
   * `TenantScopedServiceBase`.
   */
  public getCacheInvalidationScope(): string {
    return super.getCacheScope();
  }
}
