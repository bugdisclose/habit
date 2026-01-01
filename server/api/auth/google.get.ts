export default defineOAuthGoogleEventHandler({
    async onSuccess(event, { user }) {
        await useDB()
            .insert(tables.users)
            .values({
                id: user.sub,
                login: user.email.split('@')[0].toLowerCase(),
                name: user.name,
                avatarUrl: user.picture,
                createdAt: new Date(),
            })
            .onConflictDoUpdate({
                target: tables.users.id,
                set: {
                    name: user.name,
                    avatarUrl: user.picture,
                },
            })
            .returning()
            .get();
        await setUserSession(event, {
            user: {
                id: user.sub,
                login: user.email.split('@')[0].toLowerCase(),
                name: user.name,
                avatarUrl: user.picture,
            }
        });
        return sendRedirect(event, `/${user.email.split('@')[0].toLowerCase()}`);
    },
});
