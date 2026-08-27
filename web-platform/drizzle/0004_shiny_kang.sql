CREATE TABLE `approved_message_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationSessionId` int NOT NULL,
	`userId` int NOT NULL,
	`contactName` varchar(256) NOT NULL,
	`contactPhone` varchar(48),
	`sourceChannel` enum('manual_message','whatsapp','sms') NOT NULL,
	`consentConfirmedAt` timestamp NOT NULL,
	`messageContent` text NOT NULL,
	`status` enum('imported','approved','rejected','executed') NOT NULL DEFAULT 'imported',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approved_message_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('voice','text','image','document','message') NOT NULL,
	`status` enum('collecting','ready_for_review','confirmed','executed','cancelled','failed') NOT NULL DEFAULT 'collecting',
	`intent` varchar(96),
	`sourceTranscript` text,
	`collectedFields` json,
	`nextQuestion` text,
	`summary` text,
	`analysisModel` varchar(128),
	`confirmationAt` timestamp,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_turns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationSessionId` int NOT NULL,
	`turnNumber` int NOT NULL,
	`speaker` enum('assistant','user','system') NOT NULL,
	`modality` enum('voice','text','image','document','message') NOT NULL,
	`content` text NOT NULL,
	`normalizedFields` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_turns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_excel_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`requestedFrom` timestamp,
	`requestedTo` timestamp,
	`recordCount` int NOT NULL DEFAULT 0,
	`workbookKey` varchar(512),
	`status` enum('created','downloaded','failed') NOT NULL DEFAULT 'created',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_excel_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `approved_message_imports` ADD CONSTRAINT `ami_conv_fk` FOREIGN KEY (`conversationSessionId`) REFERENCES `conversation_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approved_message_imports` ADD CONSTRAINT `ami_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_sessions` ADD CONSTRAINT `cs_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_turns` ADD CONSTRAINT `ct_session_fk` FOREIGN KEY (`conversationSessionId`) REFERENCES `conversation_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_excel_exports` ADD CONSTRAINT `oee_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
