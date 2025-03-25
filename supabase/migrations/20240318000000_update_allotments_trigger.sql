-- Update the function to handle all request status changes
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

    -- Then update the current_requests count
    -- This will count only pending and approved requests
    -- Cancelled, denied, and cancellation_pending requests are not counted
    WITH request_counts AS (
        SELECT 
            request_date,
            division,
            COUNT(*) as request_count
        FROM pld_sdv_requests
        WHERE status IN ('pending', 'approved')
        AND NOT (status = 'cancellation_pending' OR status = 'cancelled' OR status = 'denied')
        GROUP BY request_date, division
    )
    UPDATE pld_sdv_allotments a
    SET current_requests = COALESCE((
        SELECT request_count 
        FROM request_counts rc 
        WHERE rc.request_date = a.date 
        AND rc.division = a.division
    ), 0);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_request_count ON public.pld_sdv_requests;

-- Create the trigger to run on any change to pld_sdv_requests
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
    AND NOT (status = 'cancellation_pending' OR status = 'cancelled' OR status = 'denied')
    GROUP BY request_date, division
)
UPDATE pld_sdv_allotments a
SET current_requests = COALESCE((
    SELECT request_count 
    FROM request_counts rc 
    WHERE rc.request_date = a.date 
    AND rc.division = a.division
), 0); 