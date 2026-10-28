import {
    Controller,
    Get,
    HttpCode,
    INestApplication,
    Post,
    RawBodyRequest,
    Req,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { LoggerModule } from 'nestjs-pino';
import * as request from 'supertest';
import { Public } from '../common/decorators/PublicLogin';
import { RequiresFeature } from '../common/decorators/RequiresFeature';
import { Feature } from '../modules/feature-flags/utils/feature.registry';
import { RequestContextService } from '../modules/request-context/RequestContextService';
import { createHttpTestApp } from './http-test-app';
import { TestRequestContextService } from './mocks/test-request-context.service';
import { TestUser } from './test-user-guard';

/**
 * The harness itself: production create options (raw body) and the production
 * global-guard list, without a database.
 */
const FEATURE: Feature = 'ORDER_MANAGEMENT';

@Controller('harness-probe')
class ProbeController {
    @Public()
    @Post('raw')
    @HttpCode(200)
    raw(@Req() req: RawBodyRequest<Request>) {
        return {
            raw: req.rawBody?.toString('base64') ?? null,
            parsed: req.body as unknown,
        };
    }

    @Get('authed')
    authed() {
        return { ok: true };
    }

    @RequiresFeature(FEATURE)
    @Get('featured')
    featured() {
        return { ok: true };
    }
}

async function compileProbeModule(): Promise<TestingModule> {
    return Test.createTestingModule({
        imports: [
            LoggerModule.forRoot({
                pinoHttp: {
                    level: 'warn',
                    transport: { target: 'pino-pretty' },
                },
            }),
        ],
        controllers: [ProbeController],
        providers: [
            {
                provide: RequestContextService,
                useClass: TestRequestContextService,
            },
        ],
    }).compile();
}

describe('createHttpTestApp', () => {
    describe('with the global guards', () => {
        let app: INestApplication;
        let currentUser: TestUser | undefined;

        beforeAll(async () => {
            ({ app } = await createHttpTestApp(await compileProbeModule(), {
                user: () => currentUser,
            }));
        });

        afterAll(async () => {
            await app.close();
        });

        beforeEach(() => {
            currentUser = undefined;
        });

        it('exposes req.rawBody as the exact bytes sent', async () => {
            // Spacing, key order and a multi-byte char that re-serialising would change
            const sent = Buffer.from('{ "b" :1,\n\t"a":"café"  }', 'utf8');

            const res = await request(app.getHttpServer())
                .post('/harness-probe/raw')
                .set('Content-Type', 'application/json')
                .send(sent.toString('utf8'))
                .expect(200);

            expect(res.body).toEqual({
                raw: sent.toString('base64'),
                parsed: { b: 1, a: 'café' },
            });
        });

        it('rejects a non-public route without a user (401)', async () => {
            await request(app.getHttpServer())
                .get('/harness-probe/authed')
                .expect(401);
        });

        it('runs FeatureGuard: denied without the feature, allowed with it', async () => {
            currentUser = {
                tenantId: 1,
                isTenantAdmin: true,
                locations: [],
                features: [],
            };
            await request(app.getHttpServer())
                .get('/harness-probe/featured')
                .expect(403);

            currentUser = { ...currentUser, features: [FEATURE] };
            await request(app.getHttpServer())
                .get('/harness-probe/featured')
                .expect(200);

            // Omitted features default to every registered feature
            currentUser = { tenantId: 1, isTenantAdmin: true, locations: [] };
            await request(app.getHttpServer())
                .get('/harness-probe/featured')
                .expect(200);
        });
    });

    describe('with guards: false', () => {
        let app: INestApplication;

        beforeAll(async () => {
            ({ app } = await createHttpTestApp(await compileProbeModule(), {
                guards: false,
            }));
        });

        afterAll(async () => {
            await app.close();
        });

        it('runs no global guards', async () => {
            await request(app.getHttpServer())
                .get('/harness-probe/authed')
                .expect(200);
            await request(app.getHttpServer())
                .get('/harness-probe/featured')
                .expect(200);
        });
    });
});
