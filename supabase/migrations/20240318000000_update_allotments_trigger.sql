-- Update the function to count both pending and approved requests
CREATE OR REPLACE FUNCTION public.handle_request_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current_requests count in pld_sdv_allotments
    -- This will count both pending and approved requests
    WITH request_counts AS (
        SELECT 
            request_date,
            division,
            COUNT(*) as request_count
        FROM pld_sdv_requests
        WHERE status IN ('pending', 'approved')
        GROUP BY request_date, division
    )
    UPDATE pld_sdv_allotments a
    SET current_requests = COALESCE(rc.request_count, 0)
    FROM request_counts rc
    WHERE a.date = rc.request_date
    AND a.division = rc.division;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_request_count ON public.pld_sdv_requests;

-- Create the trigger
CREATE TRIGGER update_request_count
    AFTER INSERT OR UPDATE OR DELETE ON public.pld_sdv_requests
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.handle_request_count();

-- Update existing records
WITH request_counts AS (
    SELECT 
        request_date,
        division,
        COUNT(*) as request_count
    FROM pld_sdv_requests
    WHERE status IN ('pending', 'approved')
    GROUP BY request_date, division
)
UPDATE pld_sdv_allotments a
SET current_requests = COALESCE(rc.request_count, 0)
FROM request_counts rc
WHERE a.date = rc.request_date
AND a.division = rc.division; 