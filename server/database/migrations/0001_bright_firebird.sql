PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_habits` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`complete_days` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`habit_view` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_habits`("id", "user_id", "title", "description", "complete_days", "created_at", "habit_view") SELECT "id", "user_id", "title", "description", "complete_days", "created_at", "habit_view" FROM `habits`;--> statement-breakpoint
DROP TABLE `habits`;--> statement-breakpoint
ALTER TABLE `__new_habits` RENAME TO `habits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`name` text,
	`bio` text,
	`avatar_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`user_view` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "login", "name", "bio", "avatar_url", "created_at", "user_view") SELECT "id", "login", "name", "bio", "avatar_url", "created_at", "user_view" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_login_unique` ON `users` (`login`);