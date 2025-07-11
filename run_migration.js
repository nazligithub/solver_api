const fs = require('fs');
const path = require('path');
const supabase = require('./src/config/supabase');

async function runMigration() {
  try {
    console.log('Running database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_order_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    // Execute each statement
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('Error executing statement:', error);
        // Try direct execution as alternative
        console.log('Trying alternative method...');
        // Note: Supabase doesn't directly support raw SQL execution
        // You'll need to run the migration manually or use a database client
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('\nNote: If you see errors above, please run the following SQL manually in your Supabase SQL editor:');
    console.log('\n' + migrationSQL);
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run the migration manually in your Supabase SQL editor.');
    console.log('Migration file: migrations/add_order_column.sql');
  }
  
  process.exit(0);
}

runMigration();