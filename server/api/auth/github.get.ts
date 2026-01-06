export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    try {
      const db = useDB();
      // Ensure DB is ready (triggers auto-migration if lazy loaded)
      await db.select({ id: tables.users.id }).from(tables.users).limit(1);

      await db
        .insert(tables.users)
        .values({
          id: String(user.id),
          login: user.login.toLowerCase(),
          name: user.name || user.login,
          bio: user.bio || '',
          avatarUrl: user.avatar_url,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: tables.users.id,
          set: {
            name: user.name || user.login,
            bio: user.bio || '',
            avatarUrl: user.avatar_url,
          },
        })
        .returning()
        .get();

      await setUserSession(event, {
        user: {
          id: String(user.id),
          login: user.login.toLowerCase(),
          name: user.name || user.login,
          avatarUrl: user.avatar_url,
        }
      });
      return sendRedirect(event, `/${user.login.toLowerCase()}`);
    } catch (err: any) {
      console.error('GitHub Login Error:', err);
      return {
        status: 'error',
        message: 'Login failed',
        details: err.message,
        stack: err.stack
      };
    }
  },
});
