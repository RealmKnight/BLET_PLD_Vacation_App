-- Add cancelled_by and cancelled_at columns
ALTER TABLE public.pld_sdv_requests
ADD COLUMN cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN cancelled_at timestamptz;

-- Create function to handle direct cancellation of pending requests
CREATE OR REPLACE FUNCTION public.cancel_pending_request(request_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_member_id uuid;
BEGIN
  -- Get the current status and member_id of the request
  SELECT status, member_id INTO v_status, v_member_id
  FROM public.pld_sdv_requests
  WHERE id = request_id;

  -- Check if request exists and belongs to the user
  IF v_member_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_member_id != user_id THEN
    RETURN false;
  END IF;

  -- Only allow cancellation of pending requests
  IF v_status != 'pending' THEN
    RETURN false;
  END IF;

  -- Update the request to cancelled status
  UPDATE public.pld_sdv_requests
  SET status = 'cancelled',
      cancelled_by = user_id,
      cancelled_at = NOW()
  WHERE id = request_id;

  RETURN true;
END;
$$;

-- Create policy to allow users to cancel their own pending requests
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
);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_pending_request TO authenticated;

-- Update trigger function to handle request count updates
CREATE OR REPLACE FUNCTION public.handle_request_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    -- Only increment count for pending or approved requests
    IF NEW.status IN ('pending', 'approved') THEN
      INSERT INTO public.pld_sdv_allotments (date, division, max_allotment, current_requests)
      VALUES (NEW.request_date, NEW.division, 6, 1)
      ON CONFLICT (date, division)
      DO UPDATE SET current_requests = COALESCE(pld_sdv_allotments.current_requests, 0) + 1;
    END IF;
    RETURN NEW;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If status changed
    IF OLD.status != NEW.status THEN
      -- If new status is pending or approved, increment count
      IF NEW.status IN ('pending', 'approved') THEN
        INSERT INTO public.pld_sdv_allotments (date, division, max_allotment, current_requests)
        VALUES (NEW.request_date, NEW.division, 6, 1)
        ON CONFLICT (date, division)
        DO UPDATE SET current_requests = COALESCE(pld_sdv_allotments.current_requests, 0) + 1;
      
      -- If old status was pending or approved, decrement count
      ELSIF OLD.status IN ('pending', 'approved') THEN
        UPDATE public.pld_sdv_allotments
        SET current_requests = GREATEST(0, COALESCE(current_requests, 0) - 1)
        WHERE date = OLD.request_date AND division = OLD.division;
      END IF;
    END IF;
    RETURN NEW;
  
  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    -- If deleted request was pending or approved, decrement count
    IF OLD.status IN ('pending', 'approved') THEN
      UPDATE public.pld_sdv_allotments
      SET current_requests = GREATEST(0, COALESCE(current_requests, 0) - 1)
      WHERE date = OLD.request_date AND division = OLD.division;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$; 