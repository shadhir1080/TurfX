-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed');

-- Create System Settings Table
CREATE TABLE public.system_settings (
    id integer PRIMARY KEY DEFAULT 1,
    default_commission_rate numeric NOT NULL DEFAULT 10.00,
    CONSTRAINT single_row CHECK (id = 1)
);
-- Insert default setting
INSERT INTO public.system_settings (id, default_commission_rate) VALUES (1, 10.00);

-- Create Profiles Table
CREATE TABLE public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    role user_role default 'user'::user_role not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Turfs Table
CREATE TABLE public.turfs (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    description text,
    location jsonb,
    price_per_hour numeric not null,
    images text[],
    is_verified boolean default false,
    custom_commission_rate numeric,
    razorpay_linked_account_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Bookings Table
CREATE TABLE public.bookings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    turf_id uuid references public.turfs(id) on delete cascade not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    total_amount numeric not null,
    commission_amount numeric not null,
    status booking_status default 'pending'::booking_status not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Payments Table
CREATE TABLE public.payments (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings(id) on delete cascade not null,
    razorpay_order_id text,
    razorpay_payment_id text,
    status payment_status default 'created'::payment_status not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings (Admins only can write, everyone can read)
CREATE POLICY "System settings are viewable by everyone" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "System settings editable by admin" ON public.system_settings FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile, Admins can update all" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Policies for turfs
CREATE POLICY "Turfs are viewable by everyone." ON public.turfs FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own turfs." ON public.turfs FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);
CREATE POLICY "Owners can update their own turfs." ON public.turfs FOR UPDATE USING (
    auth.uid() = owner_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);
CREATE POLICY "Owners can delete their own turfs." ON public.turfs FOR DELETE USING (
    auth.uid() = owner_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);

-- Policies for bookings
CREATE POLICY "Users can view their own bookings, Owners can view bookings for their turfs, Admins can view all" ON public.bookings FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT owner_id FROM public.turfs WHERE id = turf_id) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Users can insert their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Update bookings (e.g. status changes) should ideally be restricted to functions or specific roles, but for now:
CREATE POLICY "Users, Owners and Admins can update bookings" ON public.bookings FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT owner_id FROM public.turfs WHERE id = turf_id) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Policies for payments
CREATE POLICY "Users can view payments for their bookings, Admins can view all" ON public.payments FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.bookings WHERE id = booking_id) OR
    auth.uid() IN (SELECT t.owner_id FROM public.bookings b JOIN public.turfs t ON b.turf_id = t.id WHERE b.id = booking_id) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
-- We'll allow insert/update for edge functions mainly, but authenticated users might need to create initial record
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');

-- Create Trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
