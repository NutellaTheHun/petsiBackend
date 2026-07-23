import { CanActivate, ExecutionContext, INestApplication, Injectable, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RoleGuard } from '../../roles/guards/role.guard';
import { CreateReportDefinitionDto } from '../dto/create-report-definition.dto';
import { ReportDefinitionController } from './report-definition.controller';
import { ReportDefinitionService } from '../services/report-definition.service';

const TEST_JWT_SECRET = 'report-ctrl-test-secret';

@Injectable()
class TestAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new UnauthorizedException();
        try {
            const payload = this.jwtService.verify(token, { secret: TEST_JWT_SECRET });
            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }
}

const mockService = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
};

describe('ReportDefinitionController (role enforcement)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [JwtModule.register({ secret: TEST_JWT_SECRET })],
            controllers: [ReportDefinitionController],
            providers: [
                { provide: ReportDefinitionService, useValue: mockService },
                { provide: RequestContextService, useClass: TestRequestContextService },
                TestAuthGuard,
                { provide: APP_GUARD, useClass: TestAuthGuard },
                { provide: APP_GUARD, useClass: RoleGuard },
                Reflector,
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        jwtService = moduleRef.get(JwtService);
    });

    afterAll(async () => {
        await app.close();
    });

    function token(roles: string[]): string {
        return jwtService.sign({ sub: 1, roles }, { secret: TEST_JWT_SECRET });
    }

    it('POST /reports/definitions returns 403 for staff JWT', async () => {
        mockService.create.mockResolvedValue({ id: 1, name: 'test', visibility: 'management' });
        const dto: CreateReportDefinitionDto = { name: 'Test', visibility: 'management' };
        await request(app.getHttpServer())
            .post('/reports/definitions')
            .set('Authorization', `Bearer ${token(['staff'])}`)
            .send(dto)
            .expect(403);
    });

    it('PUT /reports/definitions/:id returns 403 for staff JWT', async () => {
        await request(app.getHttpServer())
            .put('/reports/definitions/1')
            .set('Authorization', `Bearer ${token(['staff'])}`)
            .send({ name: 'Updated' })
            .expect(403);
    });

    it('DELETE /reports/definitions/:id returns 403 for staff JWT', async () => {
        await request(app.getHttpServer())
            .delete('/reports/definitions/1')
            .set('Authorization', `Bearer ${token(['staff'])}`)
            .expect(403);
    });

    it('POST /reports/definitions returns 201 for manager JWT', async () => {
        mockService.create.mockResolvedValue({ id: 2, name: 'Manager Report', visibility: 'management', showHeader: true, params: [], sections: [] });
        const dto: CreateReportDefinitionDto = { name: 'Manager Report', visibility: 'management' };
        await request(app.getHttpServer())
            .post('/reports/definitions')
            .set('Authorization', `Bearer ${token(['manager'])}`)
            .send(dto)
            .expect(201);
    });
});
