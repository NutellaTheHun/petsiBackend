import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { randomBytes } from 'crypto';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { LocationsModule } from '../../locations/locations.module';
import { OrdersModule } from '../../orders/orders.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareModule } from '../square.module';
import { FakeSquareClientFactory } from './fake-square-client.factory';
import { SQUARE_CONFIG_KEYS } from './square-config';

/** Non-secret Square config values specs can assert against. */
export const SQUARE_TEST_CONFIG = {
    applicationId: 'sandbox-sq0idb-test-app',
    oauthRedirectUrl: 'http://localhost:3000/square/oauth/callback',
    settingsUrl: 'http://localhost:5173/settings/square',
} as const;

/** Fresh secrets per module, so specs never depend on a configured secret. */
function testSquareConfig() {
    return {
        [SQUARE_CONFIG_KEYS.TOKEN_ENCRYPTION_KEY]:
            randomBytes(32).toString('base64'),
        [SQUARE_CONFIG_KEYS.APPLICATION_ID]: SQUARE_TEST_CONFIG.applicationId,
        [SQUARE_CONFIG_KEYS.APPLICATION_SECRET]:
            randomBytes(32).toString('base64'),
        [SQUARE_CONFIG_KEYS.OAUTH_REDIRECT_URL]:
            SQUARE_TEST_CONFIG.oauthRedirectUrl,
        [SQUARE_CONFIG_KEYS.SETTINGS_URL]: SQUARE_TEST_CONFIG.settingsUrl,
    };
}

/**
 * `SquareClientFactory` is always replaced: by `FakeSquareClientFactory`
 * unless `squareClientFactoryClass` names another subclass. Specs never call
 * Square. Get the fake with `module.get(SquareClientFactory)`.
 * OrdersModule is imported for `OrderCategory` (the default-category FK);
 * `RevisionHistoryService` is mocked as in the other testing modules.
 */
export async function getSquareTestingModule(opts?: {
    squareClientFactoryClass?: new (...args: any[]) => SquareClientFactory;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true, load: [testSquareConfig] }),
            TypeORMPostgresTestingModule([SquareConnection]),
            SquareModule,
            OrdersModule,
            LocationsModule,
            RequestContextModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: {
                    level: 'warn',
                    transport: { target: 'pino-pretty' },
                },
            }),
        ],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(SquareClientFactory)
        .useClass(opts?.squareClientFactoryClass || FakeSquareClientFactory)
        .overrideProvider(RevisionHistoryService)
        .useValue({
            appendRevision: jest.fn().mockResolvedValue({ id: 1 }),
            listRevisions: jest.fn().mockResolvedValue([]),
            getRevisionOrThrow: jest.fn(),
            getRevisionRow: jest.fn().mockResolvedValue(null),
            removeRevisionById: jest.fn(),
        })
        .compile();
}
