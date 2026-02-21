// Prisma configuration file for Migrate v7
// See: https://pris.ly/d/config-datasource

export const config = {
	datasources: {
		db: {
			url:
				process.env.DATABASE_URL ||
				'postgresql://postgres:1234@localhost:5432/pures_pos_db',
		},
	},
};
