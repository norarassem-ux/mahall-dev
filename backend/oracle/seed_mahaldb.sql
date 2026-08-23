-- Seeds cities/categories lookup data + the 12 demo venues matching
-- mahal.city's real "Featured listings" (names, cities, categories,
-- capacities, prices) into the MAHALDB schema. Venues' rating/
-- reviews_count start as placeholders here — run seed_reviews.sql after
-- this to get the real trigger-computed values.
-- Run as: sqlplus mahaldb/<app_pwd>@localhost:1521/FREEPDB1 @seed_mahaldb.sql
SET DEFINE OFF
WHENEVER SQLERROR CONTINUE

INSERT INTO cities (city_name) VALUES ('Marrakech');
INSERT INTO cities (city_name) VALUES ('Agadir');
INSERT INTO cities (city_name) VALUES ('Fes');
INSERT INTO cities (city_name) VALUES ('Essaouira');
INSERT INTO cities (city_name) VALUES ('Casablanca');
INSERT INTO cities (city_name) VALUES ('Rabat');
INSERT INTO cities (city_name) VALUES ('Ouarzazate');
INSERT INTO cities (city_name) VALUES ('Tangier');
INSERT INTO cities (city_name) VALUES ('Merzouga');
INSERT INTO cities (city_name) VALUES ('El Jadida');

INSERT INTO categories (slug, category_name) VALUES ('heritage','Heritage & cultural');
INSERT INTO categories (slug, category_name) VALUES ('resort','Hospitality & resort');
INSERT INTO categories (slug, category_name) VALUES ('private','Private & exclusive');
INSERT INTO categories (slug, category_name) VALUES ('nature','Nature & adventure');
INSERT INTO categories (slug, category_name) VALUES ('coastal','Coastal & leisure');
INSERT INTO categories (slug, category_name) VALUES ('urban','Urban & lifestyle');
INSERT INTO categories (slug, category_name) VALUES ('corporate','Corporate & MICE');
INSERT INTO categories (slug, category_name) VALUES ('entertainment','Entertainment & production');
COMMIT;

-- Demo logins: client@example.com / owner@example.com, password: password123
-- (venues below are all attributed to the demo owner, u002)
INSERT INTO app_users (id, email, name, role, password_hash) VALUES
('u001','client@example.com','Demo Client','client','$2a$10$1zfw6b3QsigmQgO8FARk1ueJ340s5Y7kXvh47RV080HYHRGKweCtC');
INSERT INTO app_users (id, email, name, role, password_hash) VALUES
('u002','owner@example.com','Demo Owner','owner','$2a$10$1zfw6b3QsigmQgO8FARk1ueJ340s5Y7kXvh47RV080HYHRGKweCtC');
COMMIT;

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v001','Riad Zahra','riad-zahra',c.category_id,ci.city_id,'Medina',80,4000,'["Rooftop terrace","Central courtyard","Catering option"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','The courtyard fountain you will hear before you see it. At golden hour the tadelakt walls turn amber — a first choice for ceremonies under 100.','live',1,'u002','https://images.unsplash.com/photo-1624805098931-098c0d918b34?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='heritage' AND ci.city_name='Marrakech';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v002','Dunes Camp Erg','dunes-camp-erg',c.category_id,ci.city_id,'Erg Chebbi dunes',60,6500,'["Berber tents","Stargazing deck","Camel trek option"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Dunes Camp Erg is a distinctive nature venue in Merzouga, Erg Chebbi dunes. Capacity for up to 60 guests.','live',0,'u002','https://images.unsplash.com/photo-1757438059326-f53e8a5adf46?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='nature' AND ci.city_name='Merzouga';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v003','Atlas Beach Club','atlas-beach-club',c.category_id,ci.city_id,'Essaouira coast',200,3200,'["Ocean-view terrace","Fireplace lounge","Surf-adjacent"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Wind, salt air, and the bluest light in Morocco. Essaouira''s trade winds cool even August events — perfect for brands and shoots that need an edge.','live',1,'u002','https://images.unsplash.com/photo-1519594445471-0e5f86b3fb09?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='coastal' AND ci.city_name='Essaouira';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v004','Villa Janoub','villa-janoub',c.category_id,ci.city_id,'Malabata',120,8000,'["Private garden","Infinity pool","On-site chef"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Villa Janoub is a distinctive private venue in Tangier, Malabata. Capacity for up to 120 guests.','live',0,'u002','https://images.unsplash.com/photo-1757439402359-aed14d39fc1b?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='private' AND ci.city_name='Tangier';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v005','Kasbah Ait Noir','kasbah-ait-noir',c.category_id,ci.city_id,'Ait Ben Haddou',100,5400,'["Desert panorama","Sunset ceremony spot","Traditional courtyard"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Kasbah Ait Noir is a distinctive heritage venue in Ouarzazate, Ait Ben Haddou. Capacity for up to 100 guests.','live',1,'u002','https://images.unsplash.com/photo-1628962601069-ffe240250c35?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='heritage' AND ci.city_name='Ouarzazate';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v006','Skyline Rooftop','skyline-rooftop',c.category_id,ci.city_id,'Gauthier',180,2800,'["Rooftop bar","Skyline views","DJ booth"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Skyline Rooftop is a distinctive urban venue in Casablanca, Gauthier. Capacity for up to 180 guests.','live',0,'u002','https://images.unsplash.com/photo-1758165532022-a68f291317ba?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='urban' AND ci.city_name='Casablanca';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v007','Palmeraie Resort','palmeraie-resort',c.category_id,ci.city_id,'Palmeraie',300,7200,'["Pool deck","Ballroom","On-site chef","Valet parking"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Palmeraie Resort is a distinctive resort venue in Marrakech, Palmeraie. Capacity for up to 300 guests.','live',1,'u002','https://images.unsplash.com/photo-1624804821465-5c7c80f99bd1?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='resort' AND ci.city_name='Marrakech';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v008','Centre Atlantique','centre-atlantique',c.category_id,ci.city_id,'Agdal',500,9500,'["AV equipment","Breakout rooms","Simultaneous translation booths"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Centre Atlantique is a distinctive corporate venue in Rabat, Agdal. Capacity for up to 500 guests.','live',0,'u002','https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='corporate' AND ci.city_name='Rabat';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v009','Studio Lumiere','studio-lumiere',c.category_id,ci.city_id,'Racine',120,3900,'["Stage and lighting rig","Green room","Live sound"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Studio Lumiere is a distinctive entertainment venue in Casablanca, Racine. Capacity for up to 120 guests.','live',1,'u002','https://images.unsplash.com/photo-1768053921689-1bc09db904c9?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='entertainment' AND ci.city_name='Casablanca';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v010','Riad Bab El Oud','riad-bab-el-oud',c.category_id,ci.city_id,'Fes el Bali',50,3600,'["Central courtyard","Rooftop terrace","Traditional hammam"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Riad Bab El Oud is a distinctive heritage venue in Fes, Fes el Bali. Capacity for up to 50 guests.','live',0,'u002','https://images.unsplash.com/photo-1540396515873-dd778f7679e7?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='heritage' AND ci.city_name='Fes';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v011','Agafay Desert Lodge','agafay-desert-lodge',c.category_id,ci.city_id,'Agafay Desert, 30min from Marrakech',80,5800,'["Infinity pool","Berber tents","Atlas views"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','Rocky desert, not sandy — and all the better for it. The infinity pool at dusk with the Atlas silhouette behind it is genuinely unlike anything else in Morocco.','live',1,'u002','https://images.unsplash.com/photo-1677838929227-e0fc8a5885ea?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='nature' AND ci.city_name='Marrakech';

INSERT INTO venues (id,name,slug,category_id,city_id,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured,owner_id,image_url)
SELECT 'v012','El Jadida Chateau','el-jadida-chateau',c.category_id,ci.city_id,'Cite Portugaise',150,4800,'["Historic courtyard","Sea-facing terrace","Wine cellar"]',0,0,'Amina K.','owner@example.com','+212 6 00 00 00 00','El Jadida Chateau is a distinctive heritage venue in El Jadida, Cite Portugaise. Capacity for up to 150 guests.','live',0,'u002','https://images.unsplash.com/photo-1708823081954-1a9fd9266e9d?auto=format&fit=crop&w=800&q=60'
FROM categories c, cities ci WHERE c.slug='heritage' AND ci.city_name='El Jadida';

COMMIT;
PROMPT DONE — now run seed_reviews.sql for real ratings instead of the 0s above
EXIT;
