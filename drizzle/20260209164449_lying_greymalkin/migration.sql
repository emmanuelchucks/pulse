CREATE TABLE IF NOT EXISTS `daily_entries` (
	`date` text PRIMARY KEY,
	`water` real DEFAULT 0 NOT NULL,
	`mood` integer DEFAULT 0 NOT NULL,
	`sleep` real DEFAULT 0 NOT NULL,
	`exercise` real DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `goals` (
	`metric` text PRIMARY KEY,
	`value` real NOT NULL,
	`updated_at` integer NOT NULL
);
