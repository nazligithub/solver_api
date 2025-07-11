# Database Migrations

## Add Order Column Migration

This migration adds the `order` column to `hair_styles` and `hair_colors` tables to support drag-and-drop sorting functionality.

### How to Apply the Migration

#### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `add_order_column.sql`
4. Paste and run the SQL commands

#### Option 2: Using Supabase CLI
```bash
supabase db push --file migrations/add_order_column.sql
```

#### Option 3: Using psql
```bash
psql YOUR_DATABASE_URL < migrations/add_order_column.sql
```

### What This Migration Does
- Adds `order` column to `hair_styles` table
- Adds `order` column to `hair_colors` table
- Creates indexes for better query performance
- Sets initial order values based on existing IDs

### Verification
After running the migration, verify it worked by checking if the order column exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'hair_styles' AND column_name = 'order';
```

### Rollback
If you need to rollback this migration:
```sql
ALTER TABLE hair_styles DROP COLUMN IF EXISTS "order";
ALTER TABLE hair_colors DROP COLUMN IF EXISTS "order";
DROP INDEX IF EXISTS idx_hair_styles_order;
DROP INDEX IF EXISTS idx_hair_colors_order;
```