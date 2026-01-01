CREATE TABLE `habit_reactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`habit_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`reaction` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_shares` (
	`id` integer PRIMARY KEY NOT NULL,
	`habit_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`shared_with_id` text NOT NULL,
	`mode` text NOT NULL,
	`permissions` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`buddy_habit_id` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
