import { EntityManager } from 'typeorm';
import { ComposerBase } from './composer.base';
import { NestedEntityBase } from './entity.base';
import { NestedCreateDto } from './nested-create-dto.base';
import { NestedUpdateDto } from './nested-update-dto.base';

class Child {
    id: number;
    name?: string;
}

type ChildEntity = NestedEntityBase<
    Child,
    { name?: string },
    { name?: string },
    NestedCreateDto & { name?: string },
    NestedUpdateDto & { name?: string }
>;

class ChildComposer extends ComposerBase<ChildEntity> {
    protected readonly entityClass = Child;

    protected createInTransaction(dto: { name?: string }): Promise<Child> {
        return Promise.resolve({ id: 0, name: dto.name });
    }

    protected updateInTransaction(
        dto: { name?: string },
        _manager: EntityManager,
        entity: Child,
    ): Promise<void> {
        entity.name = dto.name;
        return Promise.resolve();
    }

    protected resolveCreateDto(dto: { name?: string }): { name?: string } {
        return { name: dto.name };
    }
}

/**
 * A nested `id` may only update one of the parent's current children; anything
 * else must throw rather than load (and reparent) a row from elsewhere. The
 * manager is never used on these paths, so any DB access would fail the test.
 */
describe('ComposerBase nested id guard', () => {
    const composer = new ChildComposer();
    const manager = {} as EntityManager;

    it('composeManyNestedEntity updates an existing child by id', async () => {
        const existing: Child = { id: 5, name: 'old' };
        const result = await composer.composeManyNestedEntity(
            [{ id: 5, name: 'new' }],
            manager,
            [existing],
        );
        expect(result).toEqual([{ id: 5, name: 'new' }]);
    });

    it('composeManyNestedEntity throws for an id outside existingEntities', async () => {
        await expect(
            composer.composeManyNestedEntity(
                [{ id: 6, name: 'new' }],
                manager,
                [{ id: 5 }],
            ),
        ).rejects.toThrow('is not a child of the parent being composed');
    });

    it('composeNestedEntity throws for an id that is not the current child', async () => {
        await expect(
            composer.composeNestedEntity({ id: 6 }, manager, undefined, {
                id: 5,
            }),
        ).rejects.toThrow('is not a child of the parent being composed');
        await expect(
            composer.composeNestedEntity({ id: 6 }, manager),
        ).rejects.toThrow('is not a child of the parent being composed');
    });
});
