CREATE TABLE `habit_journals` (
	`id` integer PRIMARY KEY NOT NULL,
	`habit_id` integer NOT NULL,
	`date` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer NOT NULL
);
