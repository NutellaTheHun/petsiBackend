import { Template } from '../../entities/template.entity';
import { TemplateMenuItem } from '../../entities/template-menu-item.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { templateMenuItemToNestedUpdateDto } from '../entity-transformers/template-menu-item.dto.transformer';
import { templateToUpdateDto } from '../entity-transformers/template.dto.transformer';
import { TemplateMenuItemChangeDetector } from './template-menu-item.change-detector';
import { TemplateChangeDetector } from './template.change-detector';

describe('TemplateChangeDetector', () => {
    const detector = new TemplateChangeDetector(new TemplateMenuItemChangeDetector());

    const row = (id: number, name: string, pos: number): TemplateMenuItem =>
        ({
            id,
            displayName: name,
            tablePosIndex: pos,
            menuItem: { id: 100 + id } as MenuItem,
        } as TemplateMenuItem);

    const baseEntity = (): Template =>
        ({
            id: 1,
            name: 'Breakfast',
            templateMenuItems: [row(10, 'Eggs', 0)],
        } as Template);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = templateToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change without nested changes', () => {
        const entity = baseEntity();
        const dto = templateToUpdateDto(entity, { name: 'Brunch' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({ name: 'Brunch' });
        expect(result.patch.templateMenuItems).toBeUndefined();
    });

    it('includes create template menu item rows', () => {
        const entity = { ...baseEntity(), templateMenuItems: [] };
        const createRow = {
            createId: 'c1',
            displayName: 'New',
            tablePosIndex: 0,
            menuItemId: 50,
        };
        const dto = templateToUpdateDto(entity, { templateMenuItems: [createRow] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.templateMenuItems).toEqual([createRow]);
    });

    it('patches only changed template menu item child', () => {
        const entity = baseEntity();
        const tm = row(10, 'Eggs', 0);
        const dto = {
            ...templateToUpdateDto(entity),
            templateMenuItems: [templateMenuItemToNestedUpdateDto(tm, { displayName: 'Omelette' })],
        };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.templateMenuItems).toEqual([{ id: 10, displayName: 'Omelette' }]);
    });
});
