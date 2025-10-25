-- Sample data for Norwegian Restaurant Deals
-- Run this AFTER the schema has been created

-- Insert sample restaurants
INSERT INTO restaurants (id, name, description, image_url, phone, address, city, lat, lng, categories, dine_in, takeaway) VALUES
('rest-1', 'Fjord & Furu', 'Sesongbasert norsk mat med lokale råvarer fra fjord og skog', 'https://picsum.photos/seed/fjord/800/600', '+47 40000000', 'Karl Johans gate 10', 'Oslo', 59.9139, 10.7522, ARRAY['Norsk', 'Moderne', 'Sesongbasert'], true, true),
('rest-2', 'Bella Vista', 'Autentisk italiensk pizza og pasta laget med kjærlighet', 'https://picsum.photos/seed/pizza/800/600', '+47 45000000', 'Aker Brygge 5', 'Oslo', 59.9107, 10.7327, ARRAY['Italiensk', 'Pizza', 'Pasta'], true, true),
('rest-3', 'Green Garden', 'Vegetarisk og vegansk mat som smaker fantastisk', 'https://picsum.photos/seed/vegan/800/600', '+47 46000000', 'Grünerløkka 12', 'Oslo', 59.9236, 10.7579, ARRAY['Vegetarisk', 'Vegansk', 'Sunt'], true, true),
('rest-4', 'Sushi Zen', 'Fersk sushi og japanske spesialiteter', 'https://picsum.photos/seed/sushi/800/600', '+47 47000000', 'Bogstadveien 20', 'Oslo', 59.9311, 10.7217, ARRAY['Japansk', 'Sushi', 'Asiatisk'], true, true),
('rest-5', 'Burger Brothers', 'Saftige burgere med norsk kjøtt', 'https://picsum.photos/seed/burger/800/600', '+47 48000000', 'Youngstorget 3', 'Oslo', 59.9158, 10.7467, ARRAY['Amerikansk', 'Burger', 'Fast Food'], true, true);

-- Insert sample deals
INSERT INTO deals (id, restaurant_id, title, description, image_url, original_price, discount_percentage, available_for, dietary_info, available_days, start_time, end_time, per_user_limit, total_limit, is_active) VALUES
-- Fjord & Furu deals
('deal-1', 'rest-1', 'Dagens 3-retter', 'Forrett, hovedrett og dessert med sesongens beste råvarer', 'https://picsum.photos/seed/course3/400/300', 59900, 25, ARRAY['dine_in'], ARRAY[]::TEXT[], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '11:30', '15:00', 1, 20, true),
('deal-2', 'rest-1', 'Takeaway Fiskegryte', 'Vår berømte fiskegryte perfekt for hjemme', 'https://picsum.photos/seed/fish/400/300', 32900, 20, ARRAY['takeaway'], ARRAY['Glutenfri'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], '16:00', '21:00', 2, 15, true),

-- Bella Vista deals  
('deal-3', 'rest-2', 'Margherita Pizza', 'Klassisk pizza med san marzano tomater og mozzarella', 'https://picsum.photos/seed/margherita/400/300', 18900, 30, ARRAY['dine_in', 'takeaway'], ARRAY['Vegetarisk'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday'], '16:00', '19:00', 1, 25, true),
('deal-4', 'rest-2', 'Pasta Carbonara', 'Kremet carbonara med pancetta og parmesan', 'https://picsum.photos/seed/carbonara/400/300', 22900, 25, ARRAY['dine_in'], ARRAY[]::TEXT[], ARRAY['friday', 'saturday', 'sunday'], '18:00', '21:00', 1, 15, true),

-- Green Garden deals
('deal-5', 'rest-3', 'Vegansk Buddha Bowl', 'Fargerik bowl med quinoa, grønnsaker og tahini', 'https://picsum.photos/seed/buddha/400/300', 16900, 35, ARRAY['dine_in', 'takeaway'], ARRAY['Vegansk', 'Glutenfri'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '11:00', '16:00', 2, 30, true),
('deal-6', 'rest-3', 'Smoothie + Salat', 'Grønn smoothie og sesongs salat', 'https://picsum.photos/seed/smoothie/400/300', 14900, 40, ARRAY['takeaway'], ARRAY['Vegansk', 'Raw'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], '08:00', '14:00', 1, 20, true),

-- Sushi Zen deals
('deal-7', 'rest-4', 'Sushi Sett 12 biter', 'Blandet sushi med nigiri og maki', 'https://picsum.photos/seed/sushi12/400/300', 24900, 20, ARRAY['dine_in', 'takeaway'], ARRAY[]::TEXT[], ARRAY['tuesday', 'wednesday', 'thursday'], '17:00', '20:00', 1, 12, true),
('deal-8', 'rest-4', 'Ramen + Gyoza', 'Varm ramen med grillede gyoza', 'https://picsum.photos/seed/ramen/400/300', 19900, 30, ARRAY['dine_in'], ARRAY[]::TEXT[], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '12:00', '15:00', 1, 18, true),

-- Burger Brothers deals
('deal-9', 'rest-5', 'Dobbel Cheeseburger', 'To kjøttskiver med ost, bacon og pommes frites', 'https://picsum.photos/seed/double/400/300', 21900, 25, ARRAY['dine_in', 'takeaway'], ARRAY[]::TEXT[], ARRAY['friday', 'saturday', 'sunday'], '16:00', '22:00', 1, 25, true),
('deal-10', 'rest-5', 'Vegetar Burger', 'Plantebasert burger med sweet potato fries', 'https://picsum.photos/seed/vegburger/400/300', 18900, 35, ARRAY['dine_in', 'takeaway'], ARRAY['Vegetarisk'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], '12:00', '21:00', 2, 20, true);

-- Note: Profiles and claims will be created automatically when users sign up and claim deals
