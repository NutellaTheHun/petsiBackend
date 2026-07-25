import { NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { EntityBase } from './entity.base';
import { ServiceBase } from './service.base';

/**
 * Sits between `EntityBase` and a domain's concrete `ServiceBase` subclass for
 * tenant-wide (catalog/definition) entities. Unlike domain services — which,
 * per src/common/base/CLAUDE.md, must only touch lifecycle hooks
 * (`createEntity`/`updateEntity`/etc) and never override `create`/`update`/
 * `findAll`/`findOne`/`remove` — this class is the deliberate exception: it
 * overrides those concrete CRUD methods itself, calling `super.<method>()`
 * and layering tenant scoping around it, so tenant isolation can never be
 * forgotten by an individual domain module.
 *
 * A domain service extending this only needs to: add a `tenantId` column to
 * its entity, stamp it via `this.getTenantId()` inside `createEntity`, and
 * change `extends ServiceBase<X>` to `extends TenantScopedServiceBase<X>` —
 * no constructor changes required.
 */
export abstract class TenantScopedServiceBase<
  TEntity extends EntityBase<any, any, any>,
> extends ServiceBase<TEntity> {
  /**
   * The caller's tenant, from `RequestContextService` — never trust a
   * client-supplied tenantId on a DTO.
   */
  protected getTenantId(): number {
    const tenantId = this.requestContextService.get<number>('tenantId');
    if (tenantId == null) {
      throw new NotFoundException();
    }
    return tenantId;
  }

  async findOne(
    id: number,
    relations?: string[],
  ): Promise<TEntity['__Entity']> {
    const entity = await super.findOne(id, relations);
    // A lookup for an id belonging to a different tenant behaves like the id
    // doesn't exist at all — never confirm another tenant's data exists.
    if ((entity as any).tenantId !== this.getTenantId()) {
      throw new NotFoundException();
    }
    return entity;
  }

  async remove(id: number): Promise<Boolean> {
    // Routed through findOne (rather than checking tenantId separately) so
    // the tenant check reuses the same NotFoundException-on-mismatch path,
    // and so remove() -- which ServiceBase implements as a raw manager
    // lookup by id, bypassing findOne -- gets scoped too.
    await this.findOne(id);
    return super.remove(id);
  }

  protected applyScope(
    query: SelectQueryBuilder<TEntity['__Entity']>,
    _options?: { locationId?: number },
  ): void {
    query.andWhere('entity.tenantId = :tenantId', {
      tenantId: this.getTenantId(),
    });
  }

  public getCacheScope(): string {
    return `tenant:${this.getTenantId()}`;
  }
}
