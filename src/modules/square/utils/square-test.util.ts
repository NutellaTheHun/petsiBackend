import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareTokenCryptoService } from '../services/square-token-crypto.service';
import { SQUARE_OAUTH_SCOPES } from './square-config';

@Injectable()
export class SquareTestUtil {
    constructor(
        @InjectRepository(SquareConnection)
        private readonly connectionRepo: Repository<SquareConnection>,
        private readonly tokenCrypto: SquareTokenCryptoService,
    ) {}

    /**
     * A `connected` connection for `tenantId` with encrypted tokens
     * `${P}-access-token` / `${P}-refresh-token`. The caller deletes it.
     */
    async seedConnection(
        P: string,
        tenantId: number,
        overrides: Partial<SquareConnection> = {},
    ): Promise<SquareConnection> {
        return this.connectionRepo.save(
            this.connectionRepo.create({
                tenantId,
                merchantId: `${P}-merchant-${tenantId}`,
                businessName: `${P}-business`,
                accessToken: this.tokenCrypto.encrypt(`${P}-access-token`),
                refreshToken: this.tokenCrypto.encrypt(`${P}-refresh-token`),
                accessTokenExpiresAt: new Date(Date.now() + 30 * 86_400_000),
                scopes: [...SQUARE_OAUTH_SCOPES],
                status: 'connected',
                ...overrides,
            }),
        );
    }
}
