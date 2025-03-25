-- Add cancelled_by and cancelled_at columns to track cancellation details
ALTER TABLE public.pld_sdv_requests
ADD COLUMN cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN cancelled_at timestamptz;

-- Create a function to handle user cancellations of pending requests
CREATE OR REPLACE FUNCTION public.cancel_pending_request(request_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
    request_status text;
BEGIN
    -- Get the current status of the request
    SELECT status INTO request_status
    FROM public.pld_sdv_requests
    WHERE id = request_id;

    -- Only allow cancellation of pending requests
    IF request_status = 'pending' THEN
        -- Update the request status to cancelled
        UPDATE public.pld_sdv_requests
        SET status = 'cancelled',
            cancelled_by = user_id,
            cancelled_at = NOW()
        WHERE id = request_id
        AND member_id = user_id; -- Ensure the user owns the request

        -- Return true if a row was updated
        RETURN FOUND;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy to allow users to cancel their own pending requests
CREATE POLICY "Users can cancel their own pending requests"
ON public.pld_sdv_requests
FOR UPDATE
USING (
    auth.uid() = member_id 
    AND status = 'pending'
)
WITH CHECK (
    auth.uid() = member_id 
    AND status = 'pending'
    AND NEW.status = 'cancelled'
);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_pending_request TO authenticated;

-- Update the existing trigger to properly handle direct cancellations
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
    SET current_requests = COALESCE((
        SELECT request_count 
        FROM request_counts rc 
        WHERE rc.request_date = a.date 
        AND rc.division = a.division
    ), 0);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql; 