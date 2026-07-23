import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { CreateReportDefinitionDto } from '../dto/create-report-definition.dto';
import { UpdateReportDefinitionDto } from '../dto/update-report-definition.dto';
import { ReportDefinition } from '../entities/report-definition.entity';
import { getReportsTestingModule } from '../reports-testing.module';
import { ReportDefinitionService } from './report-definition.service';

const P = `t${Date.now()}`;

describe('ReportDefinitionService', () => {
    let service: ReportDefinitionService;
    let repo: Repository<ReportDefinition>;
    let testCtx: DatabaseTestContext;
    let testContextService: TestRequestContextService;

    beforeAll(async () => {
        const module: TestingModule = await getReportsTestingModule();
        service = module.get(ReportDefinitionService);
        repo = module.get(getRepositoryToken(ReportDefinition));
        testContextService = module.get(RequestContextService) as TestRequestContextService;
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('definition lifecycle', () => {
        let definition: ReportDefinition;

        it('should create a definition with JSONB sections and params', async () => {
            const dto: CreateReportDefinitionDto = {
                name: `${P}-report`,
                visibility: 'management',
                showHeader: true,
                params: [{ name: 'date', type: 'date' }],
                sections: [
                    {
                        type: 'text',
                        order: 1,
                        title: 'Header',
                        content: 'Some text',
                    },
                ],
            };
            definition = await service.create(dto);

            expect(definition.id).toBeDefined();
            expect(definition.name).toBe(dto.name);
            expect(definition.visibility).toBe('management');
            expect(definition.showHeader).toBe(true);
            expect(definition.params).toHaveLength(1);
            expect(definition.params[0].name).toBe('date');
            expect(definition.sections).toHaveLength(1);
        });

        it('should update name, visibility, showHeader, params, and sections', async () => {
            const dto: UpdateReportDefinitionDto = {
                name: `${P}-report-updated`,
                visibility: 'staff',
                showHeader: false,
                params: [],
                sections: [],
            };
            const updated = await service.update(definition.id, dto);

            expect(updated.name).toBe(`${P}-report-updated`);
            expect(updated.visibility).toBe('staff');
            expect(updated.showHeader).toBe(false);
            expect(updated.params).toHaveLength(0);
            expect(updated.sections).toHaveLength(0);
        });

        it('should remove the definition; subsequent findOne throws NotFoundException', async () => {
            await service.remove(definition.id);
            await expect(service.findOne(definition.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('findOne throws NotFoundException for sentinel ID 9_999_999', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('findAll visibility filtering', () => {
        let mgmtDef: ReportDefinition;
        let staffDef: ReportDefinition;

        beforeAll(async () => {
            mgmtDef = await service.create({
                name: `${P}-mgmt-visibility`,
                visibility: 'management',
            });
            staffDef = await service.create({
                name: `${P}-staff-visibility`,
                visibility: 'staff',
            });
        });

        afterAll(async () => {
            await repo.delete([mgmtDef.id, staffDef.id]).catch(() => {});
        });

        it('manager context sees both management and staff definitions', async () => {
            testContextService.run(() => {}, { roles: [ROLE_MANAGER] });
            const results = await service.findAll();
            const ids = results.map((r) => r.id);
            expect(ids).toContain(mgmtDef.id);
            expect(ids).toContain(staffDef.id);
        });

        it('staff context excludes management definitions', async () => {
            testContextService.run(() => {}, { roles: [ROLE_STAFF] });
            const results = await service.findAll();
            const ids = results.map((r) => r.id);
            expect(ids).not.toContain(mgmtDef.id);
            expect(ids).toContain(staffDef.id);
        });
    });
});
