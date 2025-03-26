-- Update the trigger function to properly handle request count updates
CREATE OR REPLACE FUNCTION public.handle_request_count()
RETURNS TRIGGER AS $$
BEGIN
    -- First ensure allotment records exist for all dates with requests
    INSERT INTO pld_sdv_allotments (date, division, max_allotment, current_requests)
    SELECT DISTINCT
        request_date,
        division,
        6, -- Default max_allotment
        0  -- Will be updated in next step
    FROM pld_sdv_requests r
    WHERE NOT EXISTS (
        SELECT 1 FROM pld_sdv_allotments a
        WHERE a.date = r.request_date
        AND a.division = r.division
    );

    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        -- Only increment count for pending or approved requests
        IF NEW.status IN ('pending', 'approved') THEN
            UPDATE pld_sdv_allotments
            SET current_requests = COALESCE(current_requests, 0) + 1
            WHERE date = NEW.request_date 
            AND division = NEW.division;
        END IF;
        RETURN NEW;
    
    -- Handle UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If status changed
        IF OLD.status != NEW.status THEN
            -- If new status is pending or approved, increment count
            IF NEW.status IN ('pending', 'approved') THEN
                UPDATE pld_sdv_allotments
                SET current_requests = COALESCE(current_requests, 0) + 1
                WHERE date = NEW.request_date 
                AND division = NEW.division;
            
            -- If old status was pending or approved AND new status is cancelled or denied, decrement count
            ELSIF OLD.status IN ('pending', 'approved') 
                AND NEW.status IN ('cancelled', 'denied') THEN
                UPDATE pld_sdv_allotments
                SET current_requests = GREATEST(0, COALESCE(current_requests, 0) - 1)
                WHERE date = OLD.request_date 
                AND division = OLD.division;
            END IF;
        END IF;
        RETURN NEW;
    
    -- Handle DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        -- If deleted request was pending or approved, decrement count
        IF OLD.status IN ('pending', 'approved') THEN
            UPDATE pld_sdv_allotments
            SET current_requests = GREATEST(0, COALESCE(current_requests, 0) - 1)
            WHERE date = OLD.request_date 
            AND division = OLD.division;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's using the latest version
DROP TRIGGER IF EXISTS update_request_count ON public.pld_sdv_requests;

CREATE TRIGGER update_request_count
    AFTER INSERT OR UPDATE OR DELETE ON public.pld_sdv_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_request_count();

-- Update all existing records to ensure counts are correct
WITH request_counts AS (
    SELECT 
        request_date,
        division,
        COUNT(*) as request_count
    FROM pld_sdv_requests
    WHERE status IN ('pending', 'approved')
    AND NOT status IN ('cancelled', 'denied')
    GROUP BY request_date, division
)
UPDATE pld_sdv_allotments a
SET current_requests = COALESCE((
    SELECT request_count 
    FROM request_counts rc 
    WHERE rc.request_date = a.date 
    AND rc.division = a.division
), 0); 