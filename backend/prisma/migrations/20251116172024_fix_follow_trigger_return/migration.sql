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
    RETURN NULL; 
END;
$$ LANGUAGE plpgsql;