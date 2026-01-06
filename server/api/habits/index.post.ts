import { useValidatedBody, z } from 'h3-zod';
import { checkAndAwardBadges } from '../../utils/badges';

export default eventHandler(async event => {
  const { title, description, habitView } = await useValidatedBody(event, {
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().min(1, 'Description is required').trim(),
    habitView: z.boolean(),
  });

  const { user } = await requireUserSession(event);
  const userId = String(user.id);

  const habit = await useDB()
    .insert(tables.habits)
    .values({
      userId,
      title,
      description,
      createdAt: new Date(),
      habitView,
    })
    .returning()
    .get();

  // Check for badges (e.g., "Triple Threat" for 3 habits)
  const newBadges = await checkAndAwardBadges({ userId });

  return {
    ...habit,
    newBadges,
  };
});
