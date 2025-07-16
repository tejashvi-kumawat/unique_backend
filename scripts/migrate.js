import { initializeDatabase } from '../src/models/database.js';

async function runMigration() {
  try {
    console.log('🔄 Running database migrations...');
    await initializeDatabase();
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
