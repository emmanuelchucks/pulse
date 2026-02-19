CREATE TABLE `daily_entries` (
	`id` text PRIMARY KEY,
	`date` text NOT NULL,
	`water` real DEFAULT 0 NOT NULL,
	`mood` integer DEFAULT 0 NOT NULL,
	`sleep` real DEFAULT 0 NOT NULL,
	`exercise` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_entries_date_unique` ON `daily_entries` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `goals_metric_unique` ON `goals` (`metric`);