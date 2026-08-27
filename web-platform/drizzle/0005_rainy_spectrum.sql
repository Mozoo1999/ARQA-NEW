CREATE TABLE `vehicle_trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripNumber` varchar(40) NOT NULL,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`conversationSessionId` int,
	`loadingLocation` varchar(256) NOT NULL,
	`unloadingLocation` varchar(256) NOT NULL,
	`cubicCapacity` decimal(12,3) NOT NULL,
	`tripCount` int NOT NULL,
	`notes` text,
	`entryMethod` enum('voice','text','manual') NOT NULL,
	`sourceTranscript` text NOT NULL,
	`status` enum('confirmed','rejected') NOT NULL DEFAULT 'confirmed',
	`createdByUserId` int NOT NULL,
	`confirmedByUserId` int NOT NULL,
	`confirmedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_trips_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_trips_tripNumber_unique` UNIQUE(`tripNumber`)
);
--> statement-breakpoint
ALTER TABLE `operational_input_events` MODIFY COLUMN `sourceType` enum('vehicle_load','receiving_note','vehicle_trip','voice_command') NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicle_trips` ADD CONSTRAINT `vehicle_trips_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_trips` ADD CONSTRAINT `vehicle_trips_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_trips` ADD CONSTRAINT `vehicle_trips_conversationSessionId_conversation_sessions_id_fk` FOREIGN KEY (`conversationSessionId`) REFERENCES `conversation_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_trips` ADD CONSTRAINT `vehicle_trips_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_trips` ADD CONSTRAINT `vehicle_trips_confirmedByUserId_users_id_fk` FOREIGN KEY (`confirmedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;