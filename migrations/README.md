# Database Migrations

This folder contains database migration files for the homework API project.

## Available Migrations

### Apps Table Migration
- `create_apps_table.sql` - Creates the apps table for managing mobile app versions
- `create_simple_apps_table.sql` - Creates a simple apps table for basic app status tracking

### How to Apply Migrations

#### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file you want to apply
4. Paste and run the SQL commands

#### Option 2: Using Supabase CLI
```bash
supabase db push --file migrations/[migration_file].sql
```

#### Option 3: Using psql
```bash
psql YOUR_DATABASE_URL < migrations/[migration_file].sql
```

### Migration Order
Apply migrations in the following order:
1. `create_apps_table.sql` or `create_simple_apps_table.sql` (choose one based on your needs)
2. Other migrations as needed

### Verification
After running migrations, verify they worked by checking if the tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'apps';
```