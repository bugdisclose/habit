export default defineEventHandler(async () => {
    try {
        const db = useDB();

        // Test a query to verify connection
        const tables = await db.select({ name: sql`name` }).from(sql`sqlite_master`).where(eq(sql`type`, 'table')).all();

        return {
            status: 'success',
            message: 'Database connection established.',
            environment: process.env.NODE_ENV,
            dbPath: process.env.NODE_ENV === 'development' ? 'sqlite.db' : '/tmp/db.sqlite',
            tables: tables
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: 'Failed to connect to database.',
            error_name: error.name,
            error_message: error.message,
            error_stack: error.stack,
            environment: process.env.NODE_ENV
        };
    }
});
