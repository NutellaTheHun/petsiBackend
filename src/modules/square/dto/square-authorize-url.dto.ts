import { ApiProperty } from '@nestjs/swagger';

export class SquareAuthorizeUrlDto {
    @ApiProperty({
        example:
            'https://connect.squareupsandbox.com/oauth2/authorize?client_id=sandbox-sq0idb-…&state=…&scope=ORDERS_READ+ITEMS_READ+MERCHANT_PROFILE_READ',
        description:
            'Square authorize page; the frontend navigates the browser here',
    })
    authorizeUrl: string;
}
