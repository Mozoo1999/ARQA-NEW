CREATE TABLE `whatsapp_inbound_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerMessageId` varchar(256) NOT NULL,
	`whatsappBusinessAccountId` varchar(128),
	`phoneNumberId` varchar(128) NOT NULL,
	`senderWhatsAppId` varchar(64) NOT NULL,
	`senderName` varchar(256),
	`messageType` varchar(64) NOT NULL,
	`messageContent` text,
	`receivedAt` timestamp NOT NULL,
	`signatureVerifiedAt` timestamp NOT NULL,
	`status` enum('received','reviewed','ignored','failed') NOT NULL DEFAULT 'received',
	`reviewUserId` int,
	`conversationSessionId` int,
	`rawPayload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_inbound_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_inbound_events_providerMessageId_unique` UNIQUE(`providerMessageId`)
);
--> statement-breakpoint
ALTER TABLE `whatsapp_inbound_events` ADD CONSTRAINT `wa_event_review_user_fk` FOREIGN KEY (`reviewUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `whatsapp_inbound_events` ADD CONSTRAINT `wa_event_session_fk` FOREIGN KEY (`conversationSessionId`) REFERENCES `conversation_sessions`(`id`) ON DELETE no action ON UPDATE no action;