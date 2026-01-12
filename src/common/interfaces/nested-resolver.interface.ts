import { EntityManager } from 'typeorm';

export interface NestedResolver<ChildEntity, NestedCreate, NestedUpdate> {
  resolveSingle(
    dto: NestedCreate | NestedUpdate,
    manager: EntityManager,
    parentId?: number,
  ): Promise<ChildEntity>;

  resolveSingle(
    dto: (NestedCreate | NestedUpdate)[],
    manager: EntityManager,
    parentId?: number,
  ): Promise<ChildEntity[]>;
}
