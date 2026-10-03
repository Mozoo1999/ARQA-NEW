CREATE TABLE `user_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientUserId` int NOT NULL,
	`actorUserId` int,
	`category` enum('task','approval','update','system') NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`title` varchar(256) NOT NULL,
	`body` text,
	`module` varchar(64) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`actionUrl` varchar(512),
	`dedupeKey` varchar(160),
	`metadata` json,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_notifications_dedupeKey_unique` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notif_recipient_created_idx` ON `user_notifications` (`recipientUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notif_recipient_read_idx` ON `user_notifications` (`recipientUserId`,`isRead`);