CREATE TABLE `operational_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`primaryLanguage` enum('ar','en') NOT NULL DEFAULT 'ar',
	`dialect` varchar(24) NOT NULL DEFAULT 'ar-SA',
	`sector` enum('construction','supply','logistics','general') NOT NULL DEFAULT 'general',
	`businessLevel` enum('construction_company','supply_office','logistics_operator','general') NOT NULL DEFAULT 'general',
	`defaultUnit` varchar(32),
	`materialVocabulary` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `operational_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `conversation_sessions` ADD `contextSnapshot` json;--> statement-breakpoint
ALTER TABLE `operational_profiles` ADD CONSTRAINT `operational_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;