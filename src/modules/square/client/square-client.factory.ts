import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SquareClient } from 'square';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareTokenCryptoService } from '../services/square-token-crypto.service';
import {
    SQUARE_API_VERSION,
    selectSquareEnvironment,
} from '../utils/square-config';
import { SquareAppApi, SquareTenantApi } from './square-api';
import {
    SquareNotConnectedException,
    SquareReauthRequiredException,
} from './square-error-boundary';

/**
 * The only place Square clients are built, and the integration's only test
 * seam towards Square: testing modules override `createTenantClient` /
 * `createAppClient` (see `FakeSquareClientFactory`), so the status check and
 * token decryption still run in specs.
 */
@Injectable()
export class SquareClientFactory {
    constructor(
        private readonly config: ConfigService,
        private readonly tokenCrypto: SquareTokenCryptoService,
    ) {}

    /**
     * A client for one tenant's connection. Refuses unless the connection is
     * `connected`. Build one per tenant; never share it across tenants.
     */
    forConnection(connection: SquareConnection): SquareTenantApi {
        if (connection.status === 'needs_reauth') {
            throw new SquareReauthRequiredException();
        }
        if (connection.status !== 'connected' || !connection.accessToken) {
            throw new SquareNotConnectedException();
        }
        return this.createTenantClient(
            this.tokenCrypto.decrypt(connection.accessToken),
        );
    }

    /** A client with no tenant token, for the app's own OAuth calls. */
    forApp(): SquareAppApi {
        return this.createAppClient();
    }

    protected createTenantClient(accessToken: string): SquareTenantApi {
        return this.newClient(accessToken);
    }

    protected createAppClient(): SquareAppApi {
        return this.newClient();
    }

    private newClient(token?: string): SquareClient {
        return new SquareClient({
            token,
            environment: selectSquareEnvironment(
                this.config.get<string>('NODE_ENV'),
            ),
            version: SQUARE_API_VERSION,
        });
    }
}
