import { CanActivate, ExecutionContext, INestApplication, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RoleGuard } from '../../roles/guards/role.guard';
import { FeatureGuard } from '../../feature-flags/guards/feature.guard';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';

const TEST_JWT_SECRET = 'menu-item-feature-guard-test-secret';
const P = `t${Date.now()}`;

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

describe('menu item controller (feature guard enforcement)', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;
    let tenant: Tenant;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        jwtService = new JwtService({ secret: TEST_JWT_SECRET });

        app = module.createNestApplication();
        app.useGlobalGuards(
            new TestAuthGuard(jwtService),
            new RoleGuard(new Reflector()),
            new FeatureGuard(new Reflector()),
        );
        await app.init();
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    function token(features: string[]): string {
        return jwtService.sign(
            {
                sub: 1,
                tenantId: tenant.id,
                isTenantAdmin: false,
                locations: [{ locationId: 1, roles: ['staff'] }],
                features,
            },
            { secret: TEST_JWT_SECRET },
        );
    }

    it('rejects a request whose token has neither ORDER_MANAGEMENT nor RECIPE_MANAGEMENT', async () => {
        await request(app.getHttpServer())
            .get('/menu-items')
            .set('Authorization', `Bearer ${token(['INVENTORY_MANAGEMENT'])}`)
            .expect(403);
    });

    it('passes through to existing behavior when at least one required feature is present', async () => {
        const res = await request(app.getHttpServer())
            .get('/menu-items')
            .set('Authorization', `Bearer ${token(['RECIPE_MANAGEMENT'])}`)
            .expect(200);
        expect(res.body.items).toBeDefined();
    });
});
