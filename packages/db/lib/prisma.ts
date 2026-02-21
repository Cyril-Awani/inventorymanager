import { PrismaClient } from '@prisma/client';

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
	// For Prisma v7, pass the DATABASE_URL to PrismaClient constructor
	// See: https://pris.ly/d/prisma7-client-config
	const url =
		process.env.DATABASE_URL ||
		'postgresql://postgres:1234@localhost:5432/pures_pos_db';

	return new PrismaClient({} as any);
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
