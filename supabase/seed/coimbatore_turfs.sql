-- =============================================================
-- Coimbatore Turf Seed Data
-- Run this in your Supabase SQL Editor AFTER running migration 20260525000001
-- Note: owner_id is NULL for these seed/demo turfs. Admins can assign owners later.
-- =============================================================

INSERT INTO public.turfs (
  id, owner_id, name, description,
  location, coordinates,
  price_per_hour, images,
  is_verified, is_premium, is_24hours,
  sports, timings, amenities,
  rating, review_count,
  custom_commission_rate
) VALUES

-- 1. 433 Arena Turf
(
  gen_random_uuid(), NULL,
  '433 Arena Turf',
  'Premium football turf with top-grade artificial grass and floodlights. Located in the heart of Kuniyamuthur, perfect for evening matches and weekend tournaments.',
  '{"city": "Coimbatore", "address": "Subbulakshmi Nagar, Rangsamy Naidu Nagar, Kuniyamuthur, Coimbatore", "area": "Kuniyamuthur"}',
  '{"lat": 10.9615, "lng": 76.9558}',
  900,
  ARRAY['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
        'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80'],
  true, false, false,
  ARRAY['Football'],
  '5 AM - 11 PM',
  ARRAY['Floodlights', 'Parking', 'Drinking Water'],
  4.6, 312, NULL
),

-- 2. Kickoff Sports Arena
(
  gen_random_uuid(), NULL,
  'Kickoff Sports Arena',
  'Open 24/7 multi-sport arena for football and cricket enthusiasts. Professional-grade turf with washroom facilities and ample parking.',
  '{"city": "Coimbatore", "address": "P N Nagar, Kuniyamuthur, Coimbatore", "area": "Kuniyamuthur"}',
  '{"lat": 10.9572, "lng": 76.9495}',
  1100,
  ARRAY['https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
        'https://images.unsplash.com/photo-1510051640316-cee39563ddab?w=800&q=80'],
  true, false, true,
  ARRAY['Football', 'Cricket'],
  '24 Hours',
  ARRAY['Floodlights', 'Parking', 'Washroom'],
  4.5, 187, NULL
),

-- 3. Ground Zero
(
  gen_random_uuid(), NULL,
  'Ground Zero',
  'One of the highest-rated football turfs in Coimbatore. Maintained to professional standards with excellent floodlighting for night games.',
  '{"city": "Coimbatore", "address": "Rathinapuri, Kuniyamuthur, Coimbatore", "area": "Kuniyamuthur"}',
  '{"lat": 10.9548, "lng": 76.9529}',
  1000,
  ARRAY['https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=80',
        'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80'],
  true, false, false,
  ARRAY['Football'],
  '6 AM - 12 AM',
  ARRAY['Parking', 'Floodlights'],
  4.7, 543, NULL
),

-- 4. T&D Sports Arena (Premium)
(
  gen_random_uuid(), NULL,
  'T&D Sports Arena',
  'Coimbatore''s top-rated premium sports destination. Multi-sport facility with a cafe, flood-lit turf, and 24/7 operation — ideal for corporate events and tournaments.',
  '{"city": "Coimbatore", "address": "Eachanari, Coimbatore", "area": "Eachanari"}',
  '{"lat": 10.9215, "lng": 76.9737}',
  1800,
  ARRAY['https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=800&q=80',
        'https://images.unsplash.com/photo-1518604964687-a0a3c3f42e2a?w=800&q=80'],
  true, true, true,
  ARRAY['Football', 'Cricket', 'Box Cricket'],
  '24 Hours',
  ARRAY['Floodlights', 'Parking', 'Cafeteria', 'Washroom'],
  4.9, 891, NULL
),

-- 5. Manchester Sports Academy (Premium)
(
  gen_random_uuid(), NULL,
  'Manchester Sports Academy',
  'Multi-sport academy with three dedicated courts for football, badminton, and box cricket. Professional coaching available on weekends.',
  '{"city": "Coimbatore", "address": "Siruvani Main Road, Kalampalayam, Coimbatore", "area": "Kalampalayam"}',
  '{"lat": 10.9444, "lng": 76.9207}',
  1500,
  ARRAY['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
        'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80'],
  true, true, false,
  ARRAY['Football', 'Badminton', 'Box Cricket'],
  '5 AM - 11 PM',
  ARRAY['Parking', 'Badminton Court', 'Floodlights'],
  4.5, 264, NULL
),

-- 6. 5th Yard Football Turf
(
  gen_random_uuid(), NULL,
  '5th Yard Football Turf',
  'Popular football turf in Peelamedu featuring gallery seating for spectators. Great for competitive matches and college tournaments.',
  '{"city": "Coimbatore", "address": "Peelamedu, Coimbatore", "area": "Peelamedu"}',
  '{"lat": 11.0301, "lng": 77.0023}',
  1300,
  ARRAY['https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80'],
  true, false, false,
  ARRAY['Football'],
  '6 AM - 11 PM',
  ARRAY['Floodlights', 'Parking', 'Gallery Seating'],
  4.7, 428, NULL
),

-- 7. Wolfz Turf Cafe
(
  gen_random_uuid(), NULL,
  'Wolfz Turf Cafe',
  'Unique turf experience with an on-site cafe. Play football or cricket and unwind with food and drinks right after. A favourite hangout in Singanallur.',
  '{"city": "Coimbatore", "address": "Singanallur, Coimbatore", "area": "Singanallur"}',
  '{"lat": 11.0012, "lng": 77.0271}',
  1400,
  ARRAY['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'],
  true, false, false,
  ARRAY['Football', 'Cricket'],
  '5 AM - 12 AM',
  ARRAY['Cafe', 'Parking', 'Floodlights'],
  4.6, 156, NULL
),

-- 8. Nilgiri Football & Cricket Turf (Premium)
(
  gen_random_uuid(), NULL,
  'Nilgiri Football & Cricket Turf',
  'Premium 24-hour turf in Saravanampatti with cafe, full washroom facilities, and spacious parking. One of the largest turf venues in Coimbatore.',
  '{"city": "Coimbatore", "address": "Saravanampatti, Coimbatore", "area": "Saravanampatti"}',
  '{"lat": 11.0824, "lng": 76.9991}',
  1700,
  ARRAY['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80',
        'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80'],
  true, true, true,
  ARRAY['Football', 'Cricket'],
  '24 Hours',
  ARRAY['Floodlights', 'Parking', 'Washroom', 'Cafe'],
  4.8, 674, NULL
),

-- 9. UFC Urban Football Club (Premium)
(
  gen_random_uuid(), NULL,
  'UFC Urban Football Club',
  'Upscale football experience in RS Puram with premium seating and professional-grade turf. Ideal for corporate bookings and high-level tournaments.',
  '{"city": "Coimbatore", "address": "RS Puram, Coimbatore", "area": "RS Puram"}',
  '{"lat": 11.0089, "lng": 76.9514}',
  1600,
  ARRAY['https://images.unsplash.com/photo-1518604964687-a0a3c3f42e2a?w=800&q=80',
        'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=800&q=80'],
  true, true, false,
  ARRAY['Football'],
  '6 AM - 11 PM',
  ARRAY['Floodlights', 'Premium Seating', 'Parking'],
  4.7, 339, NULL
),

-- 10. Turf Ten5 (Luxury Premium)
(
  gen_random_uuid(), NULL,
  'Turf Ten5',
  'Coimbatore''s most premium turf experience on Avinashi Road. Luxury lounge, cafe, 24/7 operations, and state-of-the-art floodlights. The ultimate destination for serious players.',
  '{"city": "Coimbatore", "address": "Avinashi Road, Coimbatore", "area": "Avinashi Road"}',
  '{"lat": 11.0408, "lng": 77.0405}',
  2200,
  ARRAY['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
        'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=80'],
  true, true, true,
  ARRAY['Football', 'Box Cricket'],
  '24 Hours',
  ARRAY['Luxury Lounge', 'Parking', 'Floodlights', 'Cafe'],
  4.9, 1024, NULL
);
