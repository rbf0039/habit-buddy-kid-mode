-- Create profiles table for parents
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  avatar_url TEXT,
  coin_balance INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own children"
  ON public.children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own children"
  ON public.children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own children"
  ON public.children FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own children"
  ON public.children FOR DELETE
  USING (auth.uid() = parent_id);

-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  coins_per_completion INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage habits for their children"
  ON public.habits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = habits.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create habit_steps table
CREATE TABLE public.habit_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.habit_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage steps for their children's habits"
  ON public.habit_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      JOIN public.children ON habits.child_id = children.id
      WHERE habits.id = habit_steps.habit_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create habit_progress table
CREATE TABLE public.habit_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.habit_steps(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.habit_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage progress for their children"
  ON public.habit_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = habit_progress.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coin_cost INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their own rewards"
  ON public.rewards FOR ALL
  USING (auth.uid() = parent_id);

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage redemptions for their children"
  ON public.reward_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = reward_redemptions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view badges for their children"
  ON public.badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = badges.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert badges for their children"
  ON public.badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = badges.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create trigger function for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();