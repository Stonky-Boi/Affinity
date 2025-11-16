-- ---
-- Revert Feature 2: Create Friendship Row on Mutual Follow
-- This trigger is redundant because the score triggers already
-- create the friendship row on first interaction.
-- ---
DROP TRIGGER IF EXISTS tr_create_friendship_on_follow ON "Follows";

DROP FUNCTION IF EXISTS fn_create_friendship_on_mutual_follow();