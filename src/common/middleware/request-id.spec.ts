import { Controller, Get, INestApplication, MiddlewareConsumer, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { Writable } from 'stream';
import * as request from 'supertest';
import { setupApp } from '../../app.setup';
import { RequestContextModule } from '../../modules/request-context/request-context.module';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { ExceptionsModule } from '../exceptions/exceptions.module';
import { pinoHttpRequestIdOptions } from './request-id';
import { RequestIdMiddleware } from './RequestIdMiddleware';

/**
 * Mirrors AppModule's wiring (LoggerModule imported, so pino-http's middleware
 * is registered before RequestIdMiddleware) without the database, to verify
 * the pino-http access line, the request context and the response header all
 * carry one id. Also exercises the production DI path for the exception filter.
 */
const accessLines: any[] = [];
const accessStream = new Writable({
    write(chunk, _enc, cb) {
        for (const line of chunk.toString().split('\n').filter(Boolean)) {
            accessLines.push(JSON.parse(line));
        }
        cb();
    },
});

@Controller('request-id-probe')
class ProbeController {
    constructor(private readonly requestContext: RequestContextService) {}

    @Get()
    get() {
        return { contextRequestId: this.requestContext.get('requestId') };
    }
}

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: [{ ...pinoHttpRequestIdOptions }, accessStream],
        }),
        RequestContextModule,
        ExceptionsModule,
    ],
    controllers: [ProbeController],
})
class ProbeModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestIdMiddleware).forRoutes('*');
    }
}

describe('request id alignment (pino-http / request context / header)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const module = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
        app = module.createNestApplication();
        setupApp(app);
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        accessLines.length = 0;
    });

    async function lastAccessLine() {
        // pino-http writes on response finish; give the stream a tick to flush
        await new Promise((resolve) => setImmediate(resolve));
        return accessLines.filter((l) => l.req)[accessLines.filter((l) => l.req).length - 1];
    }

    it('uses one generated id for the header, request context and access line', async () => {
        const res = await request(app.getHttpServer()).get('/request-id-probe').expect(200);
        const headerId = res.headers['x-request-id'];

        expect(headerId).toEqual(expect.any(String));
        expect(res.body.contextRequestId).toBe(headerId);

        const line = await lastAccessLine();
        expect(line.req.id).toBe(headerId);
        expect(line.requestId).toBe(headerId);
    });

    it('reuses a client-supplied x-request-id everywhere', async () => {
        const res = await request(app.getHttpServer())
            .get('/request-id-probe')
            .set('x-request-id', 'client-supplied-id')
            .expect(200);

        expect(res.headers['x-request-id']).toBe('client-supplied-id');
        expect(res.body.contextRequestId).toBe('client-supplied-id');

        const line = await lastAccessLine();
        expect(line.req.id).toBe('client-supplied-id');
    });

    it('resolves the DI-provided exception filter and stamps requestId on errors', async () => {
        const res = await request(app.getHttpServer())
            .get('/no-such-route')
            .set('x-request-id', 'error-id')
            .expect(404);

        expect(res.headers['x-request-id']).toBe('error-id');
        expect(res.body.requestId).toBe('error-id');

        const line = await lastAccessLine();
        expect(line.req.id).toBe('error-id');
    });
});
