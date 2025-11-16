-- ---
-- Feature 1: Unfollow on Block
-- Replaces logic in block.controller.ts
-- ---
CREATE OR REPLACE FUNCTION fn_remove_follows_on_block()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "Follows"
    WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
       OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_block_deletes_follows ON "Block";
CREATE TRIGGER tr_block_deletes_follows
    AFTER INSERT ON "Block"
    FOR EACH ROW
    EXECUTE FUNCTION fn_remove_follows_on_block();

-- ---
-- Feature 2: Create Friendship Row on Mutual Follow
-- Replaces logic in follow.controller.ts
-- ---
CREATE OR REPLACE FUNCTION fn_create_friendship_on_mutual_follow()
RETURNS TRIGGER AS $$
DECLARE
    is_mutual BOOLEAN;
    user_a INT;
    user_b INT;
BEGIN
    IF NEW.status = 'accepted' THEN
        SELECT EXISTS (
            SELECT 1
            FROM "Follows"
            WHERE follower_id = NEW.following_id
              AND following_id = NEW.follower_id
              AND status = 'accepted'
        ) INTO is_mutual;
        IF is_mutual THEN
            user_a := LEAST(NEW.follower_id, NEW.following_id);
            user_b := GREATEST(NEW.follower_id, NEW.following_id);
            INSERT INTO "Friendship" (user_a_id, user_b_id)
            VALUES (user_a, user_b)
            ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_create_friendship_on_follow ON "Follows";
CREATE TRIGGER tr_create_friendship_on_follow
    AFTER INSERT OR UPDATE OF status ON "Follows" -- Triggers on new follows or status updates
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_friendship_on_mutual_follow();

-- ---
-- Feature 3: Friendship Score Counters
-- Replaces all logic from updateFriendshipCounters in friendship.service.ts
-- ---
CREATE OR REPLACE FUNCTION fn_update_friendship_message()
RETURNS TRIGGER AS $$
DECLARE
    convo_type TEXT;
    other_user_id INT;
    user_a INT;
    user_b INT;
BEGIN
    SELECT type INTO convo_type FROM "Conversation" WHERE id = NEW.conversation_id;
    IF convo_type = 'DIRECT' THEN
        SELECT user_id INTO other_user_id FROM "Participant"
        WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id;
        IF other_user_id IS NOT NULL THEN
            user_a := LEAST(NEW.sender_id, other_user_id);
            user_b := GREATEST(NEW.sender_id, other_user_id);
            INSERT INTO "Friendship" (user_a_id, user_b_id, num_messages)
            VALUES (user_a, user_b, 1)
            ON CONFLICT (user_a_id, user_b_id) DO UPDATE
            SET num_messages = "Friendship".num_messages + 1;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_update_friendship_reaction()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id INT;
    reacting_user_id INT;
    user_a INT;
    user_b INT;
    operation INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT author_id INTO post_author_id FROM "Post" WHERE id = NEW.post_id;
        reacting_user_id := NEW.user_id;
        operation := 1;
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT author_id INTO post_author_id FROM "Post" WHERE id = OLD.post_id;
        reacting_user_id := OLD.user_id;
        operation := -1;
    END IF;
    IF post_author_id = reacting_user_id THEN
        RETURN NULL;
    END IF;
    user_a := LEAST(post_author_id, reacting_user_id);
    user_b := GREATEST(post_author_id, reacting_user_id);
    IF operation = 1 THEN
        INSERT INTO "Friendship" (user_a_id, user_b_id, num_reactions)
        VALUES (user_a, user_b, 1)
        ON CONFLICT (user_a_id, user_b_id) DO UPDATE
        SET num_reactions = "Friendship".num_reactions + 1;
    ELSIF operation = -1 THEN
        UPDATE "Friendship"
        SET num_reactions = num_reactions - 1
        WHERE user_a_id = user_a AND user_b_id = user_b AND num_reactions > 0;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_update_friendship_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id INT;
    comment_author_id INT;
    user_a INT;
    user_b INT;
    operation INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT author_id INTO post_author_id FROM "Post" WHERE id = NEW.post_id;
        comment_author_id := NEW.author_id;
        operation := 1;
    ELSIF (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
        SELECT author_id INTO post_author_id FROM "Post" WHERE id = OLD.post_id;
        comment_author_id := OLD.author_id;
        operation := -1;
    ELSE
        RETURN NULL;
    END IF;
    IF post_author_id = comment_author_id THEN
        RETURN NULL;
    END IF;
    user_a := LEAST(post_author_id, comment_author_id);
    user_b := GREATEST(post_author_id, comment_author_id);
    IF operation = 1 THEN
        INSERT INTO "Friendship" (user_a_id, user_b_id, num_comments)
        VALUES (user_a, user_b, 1)
        ON CONFLICT (user_a_id, user_b_id) DO UPDATE
        SET num_comments = "Friendship".num_comments + 1;
    ELSIF operation = -1 THEN
        UPDATE "Friendship"
        SET num_comments = num_comments - 1
        WHERE user_a_id = user_a AND user_b_id = user_b AND num_comments > 0;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_message_score ON "Message";
CREATE TRIGGER tr_update_message_score
    AFTER INSERT ON "Message"
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_friendship_message();

DROP TRIGGER IF EXISTS tr_update_reaction_score ON "Reaction";
CREATE TRIGGER tr_update_reaction_score
    AFTER INSERT OR DELETE ON "Reaction"
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_friendship_reaction();

DROP TRIGGER IF EXISTS tr_update_comment_score ON "Comment";
CREATE TRIGGER tr_update_comment_score
    AFTER INSERT OR UPDATE OF deleted_at ON "Comment"
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_friendship_comment();