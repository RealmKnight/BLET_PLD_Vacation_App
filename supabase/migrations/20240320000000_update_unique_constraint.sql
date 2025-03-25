-- Drop the existing unique constraint and index
ALTER TABLE pld_sdv_requests DROP CONSTRAINT IF EXISTS unique_member_date;
DROP INDEX IF EXISTS unique_active_member_date_idx;

-- Create a function to check for active requests
CREATE OR REPLACE FUNCTION check_active_request_exists(
    p_member_id text,
    p_request_date date,
    p_request_id text DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM pld_sdv_requests 
        WHERE member_id = p_member_id 
        AND request_date = p_request_date
        AND status IN ('pending', 'approved', 'waitlisted', 'cancellation_pending')
        AND (p_request_id IS NULL OR id != p_request_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to prevent duplicate active requests
CREATE OR REPLACE FUNCTION prevent_duplicate_active_requests()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('pending', 'approved', 'waitlisted', 'cancellation_pending') THEN
        IF check_active_request_exists(NEW.member_id, NEW.request_date, NEW.id) THEN
            RAISE EXCEPTION 'An active request already exists for this date'
                USING HINT = 'Cancel the existing request before creating a new one';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS check_duplicate_active_requests ON pld_sdv_requests;
CREATE TRIGGER check_duplicate_active_requests
    BEFORE INSERT OR UPDATE ON pld_sdv_requests
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_active_requests(); 