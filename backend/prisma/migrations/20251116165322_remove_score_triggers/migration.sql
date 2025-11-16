-- ---
-- Revert Feature 3: Friendship Score Counters
-- ---

DROP TRIGGER IF EXISTS tr_update_message_score ON "Message";
DROP TRIGGER IF EXISTS tr_update_reaction_score ON "Reaction";
DROP TRIGGER IF EXISTS tr_update_comment_score ON "Comment";

DROP FUNCTION IF EXISTS fn_update_friendship_message();
DROP FUNCTION IF EXISTS fn_update_friendship_reaction();
DROP FUNCTION IF EXISTS fn_update_friendship_comment();