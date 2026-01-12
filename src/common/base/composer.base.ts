import { Injectable } from '@nestjs/common';
import { EntityManager, EntityTarget } from 'typeorm';
import { EntityBase } from './entity.base';

/**
 * ComposerBase is a base class for composing entities.
 *
 * It is used to create and update entities from DTOs.
 *
 * created entities are returned to the caller.
 *
 * A caller can be a service or another composer.
 *
 * The service createEntity and updateEntity methods are responsible for saving the entity to the database.
 *
 * The Composer never saves the entity to the database.
 */
@Injectable()
export abstract class ComposerBase<
  T extends EntityBase<any, any, any, any, any>,
> {
  protected abstract readonly entityClass: EntityTarget<T['__Entity']>;

  /**
   * Creates an entity within a transaction owned by the serviceBase.
   *
   * Manager is used to create the entity and return it to the caller.
   *
   * Manager is also used to be passed to nested composers.
   */
  protected abstract createInTransaction(
    dto: T['__CDto'],
    manager: EntityManager,
  ): Promise<T['__Entity']>;

  /**
   * Updates an entity within a transaction owned by the serviceBase.
   *
   * Manager is used to create child entities, and be passed to nested composers.
   *
   * Entity is the entity to update.
   */
  protected abstract updateInTransaction(
    dto: T['__UDto'],
    manager: EntityManager,
    entity: T['__Entity'],
  ): Promise<void>;

  /**
   * Resolves a nestedDto to a createDto.
   *
   * Step to include properties that are dependent on the parent being created, such as the parent ID.
   *
   * Not to include the parent reference as createDtos explicitly ask for the ID, not entire entity references.
   */
  protected abstract resolveCreateDto(
    dto: T['__NcDto'],
    context?: ResolverContext,
  ): T['__CDto'];

  /**
   * Creates an entity from a createDto.
   *
   * Manager is used to create the entity and return it to the caller.
   *
   * Context is used to pass the parent entity to the nested composers. Or any other context needed to create the entity.
   *
   * Returns the created entity.
   */
  public async composeCreate(
    dto: T['__CDto'],
    manager: EntityManager,
  ): Promise<T['__Entity']> {
    return this.createInTransaction(dto, manager);
  }

  /**
   * Updates an entity from a updateDto.
   *
   * Manager is used to create child entities, and be passed to nested composers.
   *
   * Entity is the entity to update.
   */
  public async composeUpdate(
    dto: T['__UDto'],
    manager: EntityManager,
    entity: T['__Entity'],
  ): Promise<void> {
    await this.updateInTransaction(dto, manager, entity);
  }

  /**
   * Composes a single entity from a nestedDto.
   *
   * Manager is used to create the entity and return it to the caller.
   *
   * Context is used to pass the parent entity to the nested composers. Or any other context needed to create the entity.
   *
   * Returns the composed entity or throws an error if the entity is not found.
   */
  async composeNestedEntity(
    dto: T['__NcDto'] | T['__NuDto'],
    manager: EntityManager,
    context?: ResolverContext,
  ): Promise<T['__Entity']> {
    if ('createId' in dto) {
      const fullDto = this.resolveCreateDto(dto as T['__NcDto'], context);
      return this.createInTransaction(fullDto, manager);
    } else {
      const entity = await manager.findOneOrFail(this.entityClass, {
        where: { id: (dto as T['__NuDto']).id },
      });
      await this.updateInTransaction(
        dto as T['__NuDto'],
        manager,
        entity as T['__Entity'],
      );
      return entity as T['__Entity'];
    }
  }

  /**
   * Composes many entities from a nestedDto.
   *
   * Manager is used to create the entities and return it to the caller.
   *
   * Existing entities are used to update the entities.
   *
   * Context is used to pass the parent entity to the nested composers. Or any other context needed to create the entities.
   *
   * Returns the composed entities.
   */
  async composeManyNestedEntity(
    dtos: (T['__NcDto'] | T['__NuDto'])[],
    manager: EntityManager,
    existingEntities?: T['__Entity'][],
    context?: ResolverContext,
  ): Promise<T['__Entity'][]> {
    const map = new Map<string | number, T['__Entity']>();

    if (existingEntities) {
      existingEntities.forEach((e) => map.set(e.id, e));
    }

    for (const dto of dtos) {
      if ('createId' in dto) {
        const fullDto = this.resolveCreateDto(dto as T['__NcDto'], context);
        const created = await this.createInTransaction(fullDto, manager);
        map.set((dto as T['__NcDto']).createId, created);
      } else {
        const entity = map.get((dto as any).id);
        if (!entity) {
          throw new Error(`Entity with id ${(dto as any).id} not found`);
        }
        await this.updateInTransaction(dto as T['__NuDto'], manager, entity);
      }
    }

    return Array.from(map.values());
  }
}
