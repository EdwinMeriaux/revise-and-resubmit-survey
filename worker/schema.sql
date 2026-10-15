CREATE TABLE IF NOT EXISTS responses (
 respondent_id TEXT NOT NULL, game TEXT NOT NULL,
 started_at TEXT NOT NULL, completed_at TEXT NOT NULL,
 overall_interest INTEGER NOT NULL, overall_feedback TEXT NOT NULL,
 card_id TEXT NOT NULL, card_title TEXT NOT NULL,
 clarity INTEGER NOT NULL, interest INTEGER NOT NULL,
 comprehension INTEGER NOT NULL, feedback TEXT NOT NULL,
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (game, respondent_id)
);
