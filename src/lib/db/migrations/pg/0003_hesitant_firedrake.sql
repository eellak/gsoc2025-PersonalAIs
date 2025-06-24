DO $$ BEGIN
ALTER TABLE "user" ADD COLUMN "preferences" json DEFAULT '{}'::json;
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;
--> statement-breakpoint

