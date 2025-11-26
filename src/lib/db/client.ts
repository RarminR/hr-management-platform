import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './types';

// Create a singleton database connection
class DatabaseConnection {
  private static instance: Kysely<Database> | null = null;

  static getInstance(): Kysely<Database> {
    if (!this.instance) {
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      const pool = new Pool({
        connectionString,
        max: 10,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      });

      this.instance = new Kysely<Database>({
        dialect: new PostgresDialect({
          pool,
        }),
      });
    }

    return this.instance;
  }

  static async destroyConnection(): Promise<void> {
    if (this.instance) {
      await this.instance.destroy();
      this.instance = null;
    }
  }
}

// Export the database instance
export const db = DatabaseConnection.getInstance();

// Helper function to get a new database instance (useful for testing)
export function createDb(connectionString?: string): Kysely<Database> {
  const pool = new Pool({
    connectionString: connectionString || process.env.DATABASE_URL,
    max: 10,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}

// Transaction helper
export async function withTransaction<T>(
  callback: (trx: Kysely<Database>) => Promise<T>
): Promise<T> {
  return db.transaction().execute(callback);
}

// Helper to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}