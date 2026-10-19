import { Injectable } from '@nestjs/common';
import { EntityManager, EntityTarget } from 'typeorm';
import { ResolverContext } from '../types/resolver-context.type';
import { NestedEntityBase } from './entity.base';
import { NestedCreateDto } from './nested-create-dto.base';
import { NestedUpdateDto } from './nested-update-dto.base';

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
    T extends NestedEntityBase<any, any, any, NestedCreateDto, NestedUpdateDto>,
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
     * Entity is the mutated target.
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
     * Existing is the parent's current child. An `id` dto may only update that child: any other id
     * throws, so a child can never be loaded from (and moved off) another parent. The parent's
     * validator rejects such ids first (`enforceNestedOwnership`), so the throw is a safeguard.
     *
     * Returns the composed entity.
     */
    async composeNestedEntity(
        dto: T['__NcDto'] | T['__NuDto'],
        manager: EntityManager,
        context?: ResolverContext,
        existing?: T['__Entity'] | null,
    ): Promise<T['__Entity']> {
        if ('createId' in dto) {
            const fullDto = this.resolveCreateDto(dto, context);
            return this.createInTransaction(fullDto, manager);
        } else {
            if (!existing || existing.id !== dto.id) {
                throw new Error(
                    `Nested entity with id ${dto.id} is not a child of the parent being composed`,
                );
            }
            await this.updateInTransaction(dto, manager, existing);
            return existing;
        }
    }

    /**
     * Composes many entities from a nestedDto.
     *
     * Manager is used to create the entities and return it to the caller.
     *
     * Existing entities are the parent's current children (loaded by the caller). An `id` dto may only
     * update one of them: any other id throws, so a child can never be loaded from (and moved off)
     * another parent. The parent's validator rejects such ids first (`enforceNestedOwnership`), so the
     * throw is a safeguard.
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
                const fullDto = this.resolveCreateDto(dto, context);
                const created = await this.createInTransaction(
                    fullDto,
                    manager,
                );
                map.set(dto.createId, created);
            } else {
                const entity = map.get(dto.id);
                if (!entity) {
                    throw new Error(
                        `Nested entity with id ${dto.id} is not a child of the parent being composed`,
                    );
                }

                await this.updateInTransaction(dto, manager, entity);
            }
        }

        return Array.from(map.values());
    }
}
