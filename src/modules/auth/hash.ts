import * as bcrypt from 'bcrypt';

export const saltOrRounds = 10

export async function hashPassword(password: string) : Promise<string> {
    return await bcrypt.hash(password, saltOrRounds);
}

export async function isPassHashMatch(rawPassword, compareHash): Promise<boolean>{
    return await bcrypt.compare(rawPassword, compareHash);
}