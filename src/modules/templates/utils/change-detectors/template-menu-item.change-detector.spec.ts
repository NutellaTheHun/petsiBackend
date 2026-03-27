import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { TemplateMenuItem } from '../../entities/template-menu-item.entity';
import {
    templateMenuItemToNestedUpdateDto,
    templateMenuItemToUpdateDto,
} from '../entity-transformers/template-menu-item.dto.transformer';
import { TemplateMenuItemChangeDetector } from './template-menu-item.change-detector';

describe('TemplateMenuItemChangeDetector', () => {
    const detector = new TemplateMenuItemChangeDetector();

    const baseEntity = (): TemplateMenuItem =>
        ({
            id: 1,
            displayName: 'Item A',
            tablePosIndex: 0,
            menuItem: { id: 10 } as MenuItem,
        } as TemplateMenuItem);

    it('returns empty patch for UpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = templateMenuItemToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('returns empty patch for NestedUpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = templateMenuItemToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects field changes', () => {
        const entity = baseEntity();
        const dto = templateMenuItemToNestedUpdateDto(entity, {
            displayName: 'B',
            tablePosIndex: 3,
            menuItemId: 11,
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({
            id: 1,
            displayName: 'B',
            tablePosIndex: 3,
            menuItemId: 11,
        });
    });
});
