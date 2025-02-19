import * as bcrypt from 'bcrypt';

export const saltOrRounds = 10

export async function hashPassword(password: string) : Promise<string> {
    const result = await bcrypt.hash(password, saltOrRounds);
    return result;
}

export async function isPassHashMatch(rawPassword, compareHash): Promise<boolean>{
    const result = await bcrypt.compare(rawPassword, compareHash);
    return result;
}