CREATE TABLE responses_review_migration (
 respondent_id TEXT NOT NULL, game TEXT NOT NULL,
 started_at TEXT NOT NULL, completed_at TEXT NOT NULL,
 overall_interest INTEGER NOT NULL, overall_feedback TEXT NOT NULL,
 card_id TEXT NOT NULL, card_title TEXT NOT NULL,
 clarity INTEGER NOT NULL, interest INTEGER,
 comprehension INTEGER NOT NULL, feedback TEXT NOT NULL,
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 survey_version INTEGER NOT NULL DEFAULT 1,
 verdict TEXT, technical_issues TEXT, writing_issues TEXT,
 PRIMARY KEY (game, respondent_id)
);
INSERT INTO responses_review_migration
 (respondent_id,game,started_at,completed_at,overall_interest,overall_feedback,card_id,card_title,clarity,interest,comprehension,feedback,received_at)
SELECT respondent_id,game,started_at,completed_at,overall_interest,overall_feedback,card_id,card_title,clarity,interest,comprehension,feedback,received_at FROM responses;
UPDATE responses_review_migration SET verdict=CASE comprehension WHEN 0 THEN 'Accept' WHEN 1 THEN 'Revise' WHEN 2 THEN 'Reject' END WHERE game='revise-and-resubmit';
DROP TABLE responses;
ALTER TABLE responses_review_migration RENAME TO responses;
