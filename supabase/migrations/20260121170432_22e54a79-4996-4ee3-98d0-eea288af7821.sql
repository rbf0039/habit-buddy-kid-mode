-- Create a function to validate habit completion constraints
CREATE OR REPLACE FUNCTION public.validate_habit_completion()
RETURNS TRIGGER AS $$
DECLARE
  habit_record RECORD;
  completions_today INTEGER;
  last_completion TIMESTAMP WITH TIME ZONE;
  cooldown_end TIMESTAMP WITH TIME ZONE;
  current_day_of_week TEXT;
  day_names TEXT[] := ARRAY['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
BEGIN
  -- Get habit details
  SELECT * INTO habit_record FROM public.habits WHERE id = NEW.habit_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;
  
  -- Get current day of week (0 = Sunday, 6 = Saturday)
  current_day_of_week := day_names[EXTRACT(DOW FROM CURRENT_TIMESTAMP)::INTEGER + 1];
  
  -- Check if habit is scheduled for today (custom days)
  IF habit_record.frequency = 'custom' AND habit_record.allowed_days IS NOT NULL THEN
    IF NOT (current_day_of_week = ANY(habit_record.allowed_days)) THEN
      RAISE EXCEPTION 'This habit is not scheduled for today';
    END IF;
  END IF;
  
  -- For habits without steps (step_id IS NULL), check completion limits
  IF NEW.step_id IS NULL THEN
    -- Count completions today for this habit (excluding steps)
    SELECT COUNT(*) INTO completions_today
    FROM public.habit_progress
    WHERE habit_id = NEW.habit_id
      AND child_id = NEW.child_id
      AND date = CURRENT_DATE
      AND step_id IS NULL;
    
    -- Check if max completions reached
    IF completions_today >= habit_record.times_per_period THEN
      RAISE EXCEPTION 'Maximum completions (%) for today already reached', habit_record.times_per_period;
    END IF;
    
    -- Check cooldown for multi-completion habits
    IF habit_record.times_per_period > 1 AND habit_record.cooldown_minutes > 0 THEN
      SELECT MAX(completed_at) INTO last_completion
      FROM public.habit_progress
      WHERE habit_id = NEW.habit_id
        AND child_id = NEW.child_id
        AND date = CURRENT_DATE
        AND step_id IS NULL;
      
      IF last_completion IS NOT NULL THEN
        cooldown_end := last_completion + (habit_record.cooldown_minutes || ' minutes')::INTERVAL;
        IF CURRENT_TIMESTAMP < cooldown_end THEN
          RAISE EXCEPTION 'Cooldown active. Please wait until %', cooldown_end;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate before insert
DROP TRIGGER IF EXISTS validate_habit_completion_trigger ON public.habit_progress;
CREATE TRIGGER validate_habit_completion_trigger
  BEFORE INSERT ON public.habit_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_habit_completion();