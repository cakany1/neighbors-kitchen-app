-- Create profiles table for user preferences including language
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  karma INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone (for displaying chef info)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create meals table with scheduling
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  pricing_minimum DECIMAL NOT NULL DEFAULT 0,
  pricing_suggested DECIMAL,
  is_cooking_experience BOOLEAN NOT NULL DEFAULT false,
  available_portions INTEGER NOT NULL DEFAULT 1,
  allergens TEXT[],
  tags TEXT[],
  neighborhood TEXT NOT NULL,
  fuzzy_lat DECIMAL NOT NULL,
  fuzzy_lng DECIMAL NOT NULL,
  exact_address TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Meals are viewable by everyone
CREATE POLICY "Meals are viewable by everyone" 
ON public.meals 
FOR SELECT 
USING (true);

-- Users can create their own meals
CREATE POLICY "Users can create their own meals" 
ON public.meals 
FOR INSERT 
WITH CHECK (auth.uid() = chef_id);

-- Users can update their own meals
CREATE POLICY "Users can update their own meals" 
ON public.meals 
FOR UPDATE 
USING (auth.uid() = chef_id);

-- Users can delete their own meals
CREATE POLICY "Users can delete their own meals" 
ON public.meals 
FOR DELETE 
USING (auth.uid() = chef_id);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_amount DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings (as chef or guest)
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() = guest_id OR 
  auth.uid() IN (SELECT chef_id FROM public.meals WHERE id = meal_id)
);

-- Guests can create bookings
CREATE POLICY "Users can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = guest_id);

-- Both chef and guest can update booking status
CREATE POLICY "Users can update their bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  auth.uid() = guest_id OR 
  auth.uid() IN (SELECT chef_id FROM public.meals WHERE id = meal_id)
);

-- Create messages table for chat with translation
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  original_language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their bookings
CREATE POLICY "Users can view messages for their bookings" 
ON public.messages 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT guest_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT chef_id FROM public.meals 
    WHERE id IN (SELECT meal_id FROM public.bookings WHERE id = booking_id)
  )
);

-- Users can send messages for their bookings
CREATE POLICY "Users can send messages for their bookings" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (
    SELECT guest_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT chef_id FROM public.meals 
    WHERE id IN (SELECT meal_id FROM public.bookings WHERE id = booking_id)
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
BEFORE UPDATE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, language)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'language', 'en')
  );
  RETURN new;
END;
$$;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();