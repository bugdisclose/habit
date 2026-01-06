import { eq } from 'drizzle-orm';
import { useValidatedParams, z } from 'h3-zod';

export default eventHandler(async event => {
  const { login } = await useValidatedParams(event, {
    login: z.string().toLowerCase(),
  });

  console.log(`[API] Fetching user for login: ${login}`);
  const user = await useDB().select().from(tables.users).where(eq(tables.users.login, login)).limit(1).get();
  console.log(`[API] Found user:`, user);

  return user;
});
