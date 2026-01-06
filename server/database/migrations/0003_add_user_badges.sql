CREATE TABLE `user_badges` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`earned_at` integer NOT NULL,
	`context` text
);

