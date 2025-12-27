import { hashPassword, isPassHashMatch } from './hash';

test('Hashing function should not equal given input', async () => {
    const passInput = "test";
    const result = await hashPassword(passInput);
    expect(result).not.toEqual(passInput);
});

test('compare hash function should equal the hashed password', async () => {
    const passInput = "test";
    const hash = await hashPassword(passInput);
    const result = await isPassHashMatch(passInput, hash);
    expect(result).toBeTruthy();
});

test('compare hash function should NOT equal the hashed password', async () => {
    const passInput = "test";
    const hash = await hashPassword(passInput);
    const result = await isPassHashMatch("NOTTEST", hash);
    expect(result).toBeFalsy();
});
