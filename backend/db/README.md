# Database Migrations

This directory contains SQL migration scripts for the EditFlow database.

## Schema Files

- `schema.sql` - Complete database schema with tables, indexes, triggers, and views

## Database Structure

### Tables

1. **users** - User accounts (clients, editors, admins)
2. **jobs** - Job postings created by clients
3. **proposals** - Editor proposals for jobs
4. **projects** - Active projects (accepted proposals)
5. **project_files** - Files uploaded for projects

### Views

- `v_active_jobs` - Active jobs with client details and proposal counts
- `v_project_details` - Projects with complete information

### Indexes

All tables have appropriate indexes for:
- Foreign keys
- Frequently queried columns
- Status fields
- Timestamp columns

## Running Migrations

### Initialize Database

The database is automatically initialized when you start the server for the first time.

### Manual Migration

If you need to manually run migrations:

```bash
cd backend
sqlite3 db.sqlite < db/schema.sql
```

### Verify Database

```bash
sqlite3 db.sqlite
.schema
.tables
.quit
```

## Schema Versioning

The `schema_version` table tracks which migrations have been applied:

```sql
SELECT * FROM schema_version;
```

## Future Migrations

To create a new migration:

1. Create a new file: `migration_v1.1.0.sql`
2. Add your changes with proper comments
3. Update schema_version table
4. Document changes in this README

## Best Practices

- Always backup the database before running migrations
- Test migrations on a development database first
- Use transactions for data modifications
- Document all schema changes
- Keep migrations idempotent (can be run multiple times safely)

## Rollback

To rollback the database:

```bash
# Backup current database
cp db.sqlite db.sqlite.backup

# Remove database and reinitialize
rm db.sqlite
npm start
```
