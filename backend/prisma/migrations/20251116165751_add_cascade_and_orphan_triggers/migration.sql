-- ---
-- Feature 1: Cascade Soft Deletes
-- ---
CREATE OR REPLACE FUNCTION fn_cascade_soft_delete_user_to_posts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE "Post"
        SET deleted_at = NEW.deleted_at
        WHERE author_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cascade_soft_delete_user ON "User";
CREATE TRIGGER tr_cascade_soft_delete_user
    AFTER UPDATE OF deleted_at ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION fn_cascade_soft_delete_user_to_posts();

CREATE OR REPLACE FUNCTION fn_cascade_soft_delete_post_to_comments()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE "Comment"
        SET deleted_at = NEW.deleted_at
        WHERE post_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cascade_soft_delete_post ON "Post";
CREATE TRIGGER tr_cascade_soft_delete_post
    AFTER UPDATE OF deleted_at ON "Post"
    FOR EACH ROW
    EXECUTE FUNCTION fn_cascade_soft_delete_post_to_comments();

-- ---
-- Feature 2: Prevent Group Orphaning
-- ---
CREATE OR REPLACE FUNCTION fn_prevent_group_orphaning()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INT;
    conversation_id INT;
BEGIN
    conversation_id := OLD.conversation_id;
    IF OLD.role = 'ADMIN' THEN
        SELECT COUNT(*)
        INTO admin_count
        FROM "Participant"
        WHERE conversation_id = conversation_id AND role = 'ADMIN';
        IF admin_count = 0 THEN
            UPDATE "Participant"
            SET role = 'ADMIN'
            WHERE user_id = (
                SELECT p.user_id
                FROM "Participant" p
                JOIN "User" u ON p.user_id = u.id
                WHERE p.conversation_id = conversation_id
                ORDER BY u.created_at ASC -- Order by oldest user account
                LIMIT 1
            );
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_group_orphaning ON "Participant";
CREATE TRIGGER tr_prevent_group_orphaning
    AFTER DELETE ON "Participant"
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_group_orphaning();