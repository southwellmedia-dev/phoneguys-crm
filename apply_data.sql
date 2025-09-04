-- First, let's truncate existing data (except auth users to preserve login)
TRUNCATE public.time_entries CASCADE;
TRUNCATE public.ticket_notes CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.repair_tickets CASCADE;
TRUNCATE public.user_id_mapping CASCADE;
TRUNCATE public.device_models CASCADE;
TRUNCATE public.manufacturers CASCADE;
TRUNCATE public.customers CASCADE;
TRUNCATE public.users CASCADE;INSERT INTO "public"."customers" ("id", "name", "email", "phone", "created_at", "updated_at", "address", "city", "state", "zip_code", "notes", "total_orders", "total_spent", "is_active") VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Johnson', 'alice.johnson@email.com', '555-0101', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, NULL, NULL, NULL, NULL, 0, 0.00, true),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Smith', 'bob.smith@email.com', '555-0102', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, NULL, NULL, NULL, NULL, 0, 0.00, true),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Charlie Brown', 'charlie.brown@email.com', '555-0103', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, NULL, NULL, NULL, NULL, 0, 0.00, true),
	('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Diana Prince', 'diana.prince@email.com', '555-0104', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, NULL, NULL, NULL, NULL, 0, 0.00, true),
	('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Edward Norton', 'edward.norton@email.com', '555-0105', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, NULL, NULL, NULL, NULL, 0, 0.00, true),
	('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Fiona Green', 'fiona.green@email.com', '555-0106', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, NULL, NULL, NULL, NULL, 0, 0.00, true),
	('486abf9d-fe13-4fb1-a05e-38bae0be1bb4', 'Michael Froseth', 'michael@southwellmedia.com', '9455452608', '2025-09-03 21:28:28.892+00', '2025-09-03 21:29:46.477394+00', '805 Bluff Ave E', 'Shakopee', 'MN', '55379', 'Customer has an Apple iPhone 16 Pro Max', 0, 0.00, true);


--
-- Data for Name: manufacturers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."manufacturers" ("id", "name", "logo_url", "country", "is_active", "total_repairs_count", "created_at", "updated_at") VALUES
	('72985891-6802-4a2f-bbdd-c8e618b78720', 'Samsung', NULL, 'South Korea', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Google', NULL, 'United States', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('7cf66721-2bd7-4477-af09-ab080734c1bd', 'OnePlus', NULL, 'China', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('0c9df595-89d4-452a-a2f3-58a534be1d82', 'Motorola', NULL, 'United States', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('a6a192be-b2b0-4ee6-8043-4d32876c1ab4', 'LG', NULL, 'South Korea', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('2baf0c99-fa0e-45bd-96b1-f6846444d053', 'Nokia', NULL, 'Finland', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('85184b32-e1a5-41f0-aa00-690fe651ae7b', 'Sony', NULL, 'Japan', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('37cfba03-153d-4aea-b354-f7c4d1d0af70', 'Huawei', NULL, 'China', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('f689c4d6-f52f-475a-9c17-0c71a03a5b58', 'Xiaomi', NULL, 'China', true, 0, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('d2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'Apple', NULL, 'United States', true, 2, '2025-09-03 20:37:32.166493+00', '2025-09-03 21:29:10.730347+00');


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."devices" ("id", "manufacturer_id", "model_name", "model_number", "device_type", "release_year", "thumbnail_url", "image_url", "description", "specifications", "screen_size", "storage_options", "color_options", "common_issues", "average_repair_cost", "average_repair_time_hours", "parts_availability", "is_active", "total_repairs_count", "created_at", "updated_at") VALUES
	('80c45429-8436-4c9c-ad20-7ae09bd36ebd', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Plus', NULL, 'smartphone', 2022, NULL, '/images/devices/iphone/iphone-14-plus.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.802789+00', '2025-09-04 00:51:11.802789+00'),
	('6122f4a8-e9ba-41cc-9710-d25ae10364a5', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13 Pro', NULL, 'smartphone', 2021, NULL, '/images/devices/iphone/iphone-13-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.827269+00', '2025-09-04 00:51:11.827269+00'),
	('9c612b2e-7d9f-492b-873c-e6125dc68456', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone SE 3rd Gen', NULL, 'smartphone', 2022, NULL, '/images/devices/iphone/iphone-se-3rd-gen.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.905016+00', '2025-09-04 00:51:11.905016+00'),
	('e66286bf-bc0c-442a-8e84-fd0beee81306', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone SE 2nd Gen', NULL, 'smartphone', 2020, NULL, '/images/devices/iphone/iphone-se-2020.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.912724+00', '2025-09-04 00:51:11.912724+00'),
	('6a2fb5f2-7068-46f5-8673-02112502e4c1', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone XS', NULL, 'smartphone', 2018, NULL, '/images/devices/iphone/iphone-xs.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.929649+00', '2025-09-04 00:51:11.929649+00'),
	('c813d3e2-9cde-4905-84a3-d3b58aeb6a39', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone XR', NULL, 'smartphone', 2018, NULL, '/images/devices/iphone/iphone-xr.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.937423+00', '2025-09-04 00:51:11.937423+00'),
	('d737b9c0-2b58-4bb7-a363-e61637fb3c9e', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone X', NULL, 'smartphone', 2017, NULL, '/images/devices/iphone/iphone-x.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.94669+00', '2025-09-04 00:51:11.94669+00'),
	('8181ce81-f55e-4da7-985c-528575a980bf', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad Pro 12.9" (6th Gen)', NULL, 'tablet', 2022, NULL, '/images/devices/ipad/ipad-pro-12-9-2022.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.956662+00', '2025-09-04 00:51:11.956662+00'),
	('3a74b4f7-405f-407b-bb01-74706703163b', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad Pro 11" (4th Gen)', NULL, 'tablet', 2022, NULL, '/images/devices/ipad/ipad-pro-11-2022.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.967073+00', '2025-09-04 00:51:11.967073+00'),
	('1c2a5880-7e85-4dc0-8b5d-d9d8b79229d6', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad Air (5th Gen)', NULL, 'tablet', 2022, NULL, '/images/devices/ipad/ipad-air-5.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.976823+00', '2025-09-04 00:51:11.976823+00'),
	('b84a0ab0-31fd-442d-8c00-eb2a4719aede', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad (10th Gen)', NULL, 'tablet', 2022, NULL, '/images/devices/ipad/ipad-10.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.984812+00', '2025-09-04 00:51:11.984812+00'),
	('68e6a1de-c88c-4d04-b829-400846783518', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad (9th Gen)', NULL, 'tablet', 2021, NULL, '/images/devices/ipad/ipad-9.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.993069+00', '2025-09-04 00:51:11.993069+00'),
	('987fe210-2ebe-4142-bd84-f46612e3d6f9', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad Mini (6th Gen)', NULL, 'tablet', 2021, NULL, '/images/devices/ipad/ipad-mini-6.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.001235+00', '2025-09-04 00:51:12.001235+00'),
	('1edf20c8-becf-4b2c-9002-598873eec5d4', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S24 Ultra', NULL, 'smartphone', 2024, NULL, '/images/devices/samsung/galaxy-s24-ultra.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.009746+00', '2025-09-04 00:51:12.009746+00'),
	('54fc6df2-6d9d-425f-8b09-ccfde3d62d96', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S24+', NULL, 'smartphone', 2024, NULL, '/images/devices/samsung/galaxy-s24-plus.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.01839+00', '2025-09-04 00:51:12.01839+00'),
	('2f3d59aa-4bac-4077-a164-9c315f0e5a95', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S24', NULL, 'smartphone', 2024, NULL, '/images/devices/samsung/galaxy-s24.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.027737+00', '2025-09-04 00:51:12.027737+00'),
	('e31c0e22-db46-4f01-ada5-db2bb99a7e32', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S23 Ultra', NULL, 'smartphone', 2023, NULL, '/images/devices/samsung/galaxy-s23-ultra.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.036587+00', '2025-09-04 00:51:12.036587+00'),
	('32f0b940-9234-4da4-9f74-621a1db28c2f', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S23+', NULL, 'smartphone', 2023, NULL, '/images/devices/samsung/galaxy-s23-plus.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.045409+00', '2025-09-04 00:51:12.045409+00'),
	('7ed6e2c1-5f1b-4043-a42e-5fc2e3e3a80e', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S23', NULL, 'smartphone', 2023, NULL, '/images/devices/samsung/galaxy-s23.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.053747+00', '2025-09-04 00:51:12.053747+00'),
	('35c3b906-c38f-4f23-a91c-19160ef36dbf', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 11', NULL, 'smartphone', 2019, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-11.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.897257+00', '2025-09-04 01:43:39.531678+00'),
	('4a2c2b61-d804-4e7f-804a-e246f706ea5c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 11 Pro', NULL, 'smartphone', 2019, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-11-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.889108+00', '2025-09-04 01:43:39.564816+00'),
	('374e9ed4-6394-47e0-98d9-fc0fbfc8744c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12', NULL, 'smartphone', 2020, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-12.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.865114+00', '2025-09-04 01:43:39.626127+00'),
	('df53021d-125a-4a45-ae06-bbcb9a4d0685', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12 Mini', NULL, 'smartphone', 2020, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-12-mini.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.873604+00', '2025-09-04 01:43:39.655782+00'),
	('12084372-94ac-4731-bb05-6f0c4e455e9e', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12 Pro', NULL, 'smartphone', 2020, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-12-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.857664+00', '2025-09-04 01:43:39.685837+00'),
	('51b9657a-14f5-49f2-9ff7-38da551c6c17', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12 Pro Max', NULL, 'smartphone', 2020, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-12-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.849873+00', '2025-09-04 01:43:39.747813+00'),
	('353c6276-55a5-40fc-a4c3-4673cb856895', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13', NULL, 'smartphone', 2021, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-13.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.83494+00', '2025-09-04 01:43:39.775683+00'),
	('2a19bd4f-46f9-41b5-a06a-927630f0d517', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13 Pro Max', NULL, 'smartphone', 2021, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-13-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.818855+00', '2025-09-04 01:43:39.833516+00'),
	('e8566206-e592-45e7-9b2a-18ff33551306', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14', NULL, 'smartphone', 2022, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-14.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.810843+00', '2025-09-04 01:43:39.944186+00'),
	('713b037c-ee80-4980-8626-97b322374765', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Pro Max', NULL, 'smartphone', 2022, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-14-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.785928+00', '2025-09-04 01:43:40.023569+00'),
	('df2e9185-4bb7-431b-9037-99615d92608c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone XS Max', NULL, 'smartphone', 2018, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-xs-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.921125+00', '2025-09-04 01:43:40.047648+00'),
	('c5a0aba7-2f69-44bb-af69-76e3d1136c87', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Pro', NULL, 'smartphone', 2023, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.755191+00', '2025-09-04 01:59:31.594526+00'),
	('b46db08f-b8a1-4f30-9ec8-e426a8233feb', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Plus', NULL, 'smartphone', 2023, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.767021+00', '2025-09-04 01:59:44.121238+00'),
	('d2ba824d-4590-4348-9992-89b29a87e488', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15', NULL, 'smartphone', 2023, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.777297+00', '2025-09-04 01:59:53.646273+00'),
	('5b017724-1084-4b81-8ca1-a613882c984c', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S22 Ultra', NULL, 'smartphone', 2022, NULL, '/images/devices/samsung/galaxy-s22-ultra.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.06221+00', '2025-09-04 00:51:12.06221+00'),
	('0d162b2a-ef8f-478c-9558-809737b1771f', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S22+', NULL, 'smartphone', 2022, NULL, '/images/devices/samsung/galaxy-s22-plus.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.070637+00', '2025-09-04 00:51:12.070637+00'),
	('9e8fd2f5-dba5-44b1-b791-d0dcbe2b5100', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S22', NULL, 'smartphone', 2022, NULL, '/images/devices/samsung/galaxy-s22.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.078693+00', '2025-09-04 00:51:12.078693+00'),
	('134e8c18-4d9d-411e-a9ec-08afe7f6f4c3', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S21+', NULL, 'smartphone', 2021, NULL, '/images/devices/samsung/galaxy-s21-plus.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.095866+00', '2025-09-04 00:51:12.095866+00'),
	('c58874c4-abc7-4a10-bb59-0de9e3927292', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S21', NULL, 'smartphone', 2021, NULL, '/images/devices/samsung/galaxy-s21.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.104512+00', '2025-09-04 00:51:12.104512+00'),
	('51cfd132-0acc-4d17-8405-dba8dd456470', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy Z Fold 5', NULL, 'smartphone', 2023, NULL, '/images/devices/samsung/galaxy-z-fold-5.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.113193+00', '2025-09-04 00:51:12.113193+00'),
	('7311ee43-8267-4c2a-82c3-02a8e6e72c93', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy Z Flip 5', NULL, 'smartphone', 2023, NULL, '/images/devices/samsung/galaxy-z-flip-5.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.121962+00', '2025-09-04 00:51:12.121962+00'),
	('4d1b544f-3d7f-4a27-8084-3849eefa871f', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy A54', NULL, 'smartphone', NULL, NULL, '/images/devices/samsung/galaxy-a54.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:12.130325+00', '2025-09-04 00:51:12.130325+00'),
	('e7920037-f882-4eb3-b3dd-febeb0209156', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy A34', NULL, 'smartphone', NULL, NULL, '/images/devices/samsung/galaxy-a34.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:12.137978+00', '2025-09-04 00:51:12.137978+00'),
	('eabcc0ae-71dc-491a-b06f-5c81e645568b', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy A14', NULL, 'smartphone', NULL, NULL, '/images/devices/samsung/galaxy-a14.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:12.145942+00', '2025-09-04 00:51:12.145942+00'),
	('3baa1791-aa95-4bf6-8617-62c5ceac3dce', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 8 Pro', NULL, 'smartphone', 2023, NULL, '/images/devices/google/pixel-8-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.15397+00', '2025-09-04 00:51:12.15397+00'),
	('1248daac-dc36-45bf-a33b-fe22f32450d5', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 8', NULL, 'smartphone', 2023, NULL, '/images/devices/google/pixel-8.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.16235+00', '2025-09-04 00:51:12.16235+00'),
	('54c6e205-5b07-46fb-8621-8dc5e5974850', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 7 Pro', NULL, 'smartphone', 2022, NULL, '/images/devices/google/pixel-7-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.170201+00', '2025-09-04 00:51:12.170201+00'),
	('1e9ef28f-7631-4966-971f-80d9b09650d6', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 7', NULL, 'smartphone', 2022, NULL, '/images/devices/google/pixel-7.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.17817+00', '2025-09-04 00:51:12.17817+00'),
	('5eae8aeb-eee0-46b1-905d-772fc89cb375', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 7a', NULL, 'smartphone', 2022, NULL, '/images/devices/google/pixel-7a.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.185825+00', '2025-09-04 00:51:12.185825+00'),
	('01aab7f2-e905-4018-9d91-79e02317e7bd', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 6 Pro', NULL, 'smartphone', 2021, NULL, '/images/devices/google/25-05-2022-1653481380pixel-6-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.193657+00', '2025-09-04 00:51:12.193657+00'),
	('9d4d69d6-625a-4e6c-9bb1-af9595018733', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 6', NULL, 'smartphone', 2021, NULL, '/images/devices/google/25-05-2022-1653481364pixel-6.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.201845+00', '2025-09-04 00:51:12.201845+00'),
	('cce52535-91c0-4a50-b933-7b99159d6ba5', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 6a', NULL, 'smartphone', 2021, NULL, '/images/devices/google/pixel-6a.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.209803+00', '2025-09-04 00:51:12.209803+00'),
	('b9256390-92e6-4967-9336-956f0a41fede', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 5a', NULL, 'smartphone', 2020, NULL, '/images/devices/google/25-05-2022-1653481348pixel-5a.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.217874+00', '2025-09-04 00:51:12.217874+00'),
	('4b607e22-737c-442f-ba47-d22b42260cb1', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 5', NULL, 'smartphone', 2020, NULL, '/images/devices/google/25-05-2022-1653481311pixel-5.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.225376+00', '2025-09-04 00:51:12.225376+00'),
	('25e8a9b2-e94c-4907-b0e2-78a089e9029f', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 4a', NULL, 'smartphone', 2019, NULL, '/images/devices/google/25-05-2022-1653481274pixel-4a.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:12.233676+00', '2025-09-04 00:51:12.233676+00'),
	('9cbac068-784b-4bcc-b315-c084b45cfcb1', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 4 XL', NULL, 'smartphone', 2019, NULL, '/images/devices/google/25-05-2022-1653481206pixel-4-xl.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:12.242753+00', '2025-09-04 00:51:12.242753+00'),
	('536f189a-af34-4591-b88a-f6122216c754', '7cf66721-2bd7-4477-af09-ab080734c1bd', 'OnePlus 12', NULL, 'smartphone', 2024, NULL, '/images/devices/oneplus/oneplus-12.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.251667+00', '2025-09-04 00:51:12.251667+00'),
	('82f1047e-f404-494c-a5c9-7a42d4feebcf', '7cf66721-2bd7-4477-af09-ab080734c1bd', 'OnePlus 11', NULL, 'smartphone', 2023, NULL, '/images/devices/oneplus/oneplus-11.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.260575+00', '2025-09-04 00:51:12.260575+00'),
	('fa0dce35-0945-49e1-9388-9755acb4bcea', '7cf66721-2bd7-4477-af09-ab080734c1bd', 'OnePlus Nord 3', NULL, 'smartphone', NULL, NULL, '/images/devices/oneplus/oneplus-nord-3.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:12.269318+00', '2025-09-04 00:51:12.269318+00'),
	('4432f6b8-c544-4a59-a975-bd2f1a8f357c', '7cf66721-2bd7-4477-af09-ab080734c1bd', 'OnePlus 10 Pro', NULL, 'smartphone', 2022, NULL, '/images/devices/oneplus/oneplus-10-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.277819+00', '2025-09-04 00:51:12.277819+00'),
	('28f7a543-aee5-485d-9651-39bac1c70515', '7cf66721-2bd7-4477-af09-ab080734c1bd', 'OnePlus 10T', NULL, 'smartphone', 2022, NULL, '/images/devices/oneplus/oneplus-10t.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.287399+00', '2025-09-04 00:51:12.287399+00'),
	('763b4454-ce8d-4a91-8144-ce0bcdf72ce7', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Pro', NULL, 'smartphone', 2022, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-14-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 1, '2025-09-04 00:51:11.794603+00', '2025-09-04 01:43:39.986674+00'),
	('372358d9-2422-4d30-a6bf-0ac74a393d2c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 16 Pro Max', '02A0', 'smartphone', 2024, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, NULL, true, 2, '2025-09-04 00:56:58.893061+00', '2025-09-04 01:59:04.522424+00'),
	('3751ce1a-d4e2-46c0-bf2a-8b7b2d16d67a', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S21 Ultra', NULL, 'smartphone', 2021, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/galaxy-s21-ultra.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.087367+00', '2025-09-04 01:43:39.499175+00'),
	('70fead5b-b26e-40be-b30d-f1a22800519d', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 11 Pro Max', NULL, 'smartphone', 2019, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-11-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.881373+00', '2025-09-04 01:43:39.593952+00'),
	('8fe8860d-a8fb-4bd2-bb61-9c984573304d', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13 Mini', NULL, 'smartphone', 2021, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-13-mini.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.842127+00', '2025-09-04 01:43:39.802149+00'),
	('d28974f7-ca7c-4116-985d-8c44dc2b4332', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Pro Max', NULL, 'smartphone', 2023, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.740854+00', '2025-09-04 01:59:20.677171+00');


--
-- Data for Name: customer_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customer_devices" ("id", "customer_id", "device_id", "serial_number", "imei", "color", "storage_size", "nickname", "purchase_date", "warranty_expires", "condition", "previous_repairs", "notes", "is_primary", "is_active", "created_at", "updated_at") VALUES
	('4da971fa-45eb-4e9b-af33-e03f7a358c6e', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '372358d9-2422-4d30-a6bf-0ac74a393d2c', 'SNLORQSAGU', '305087970722198', 'White', '32GB', NULL, NULL, NULL, 'broken', '[]', NULL, true, true, '2025-09-04 01:07:26.902001+00', '2025-09-04 01:30:24.913735+00'),
	('1b7929fc-80f1-44d0-b010-0dd1afabcfee', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '372358d9-2422-4d30-a6bf-0ac74a393d2c', 'SND1SIK97J', '918278985913105', 'Silver', '64GB', NULL, NULL, NULL, NULL, '[]', NULL, false, true, '2025-09-04 01:42:13.319289+00', '2025-09-04 01:42:13.319289+00'),
	('a4e4b744-7f2f-4b6d-bc04-5af5699f04fe', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '763b4454-ce8d-4a91-8144-ce0bcdf72ce7', 'F2LZK9XJKXF8', '353850109074471', 'Silver', '32GB', NULL, NULL, NULL, 'poor', '[]', NULL, true, true, '2025-09-04 02:00:28.032215+00', '2025-09-04 02:00:46.155025+00');


--
-- Data for Name: device_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_models" ("id", "manufacturer_id", "model_name", "model_number", "release_year", "device_type", "is_active", "total_repairs_count", "common_issues", "average_repair_time_hours", "typical_repair_cost", "image_url", "specifications", "created_at", "updated_at") VALUES
	('66a7899c-15d4-416f-9560-1f72b40ab43c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad Air', NULL, 2023, 'tablet', true, 0, '{screen_crack,software_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('6dcdfbca-325f-4188-b75b-2af25dfafeb0', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPad Pro 12.9', NULL, 2023, 'tablet', true, 0, '{screen_crack,charging_port}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('ce3433cd-e241-40d0-97d0-dd46fc68625e', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13', NULL, 2021, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('11715faf-2474-4d41-b77c-d2302127282e', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14', NULL, 2022, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('7c2b7bcf-3090-4007-b5b5-8e2d07d73786', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Pro', NULL, 2022, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('600eeecd-1527-461d-b4d5-2d14848a9820', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15', NULL, 2023, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('5564edda-b054-4d74-9e38-1fe0c5c22e20', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Pro', NULL, 2023, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('f1f5e8ab-7fc7-4956-aa1c-1ead4a1840f9', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy Z Flip 5', NULL, 2023, 'smartphone', true, 0, '{screen_crack,hinge_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('afda5981-501f-4e6a-9575-22a053c4cfad', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy Z Fold 5', NULL, 2023, 'smartphone', true, 0, '{screen_crack,hinge_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('e092dc2b-8f13-43af-90ab-46e72652f2c9', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S23', NULL, 2023, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('9ef9e83b-1e16-4596-9cc7-b5651a288fcd', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S23 Ultra', NULL, 2023, 'smartphone', true, 0, '{screen_crack,camera_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('1d3306ce-7ae0-4ee8-9f11-613de8262afd', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S24', NULL, 2024, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('f0a49171-7270-4c35-867c-593b745be883', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S24 Ultra', NULL, 2024, 'smartphone', true, 0, '{screen_crack,camera_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('be61fda1-71f4-4c3b-b615-66f0abf7eaef', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 7 Pro', NULL, 2022, 'smartphone', true, 0, '{screen_crack,software_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('6e28846c-221a-4f88-9d00-234637ca5ff4', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 8', NULL, 2023, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('fc84bac0-acf1-4ae0-832e-57987522e9fd', 'f5c8fd8c-fe7b-470d-8bb7-48d65f245b93', 'Pixel 8 Pro', NULL, 2023, 'smartphone', true, 0, '{screen_crack,camera_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('fdc386bb-cd6d-48b4-a421-c55ef6a8d35d', '7cf66721-2bd7-4477-af09-ab080734c1bd', '11', NULL, 2023, 'smartphone', true, 0, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('81105622-7858-4824-9745-930aadb3b6f1', '7cf66721-2bd7-4477-af09-ab080734c1bd', '12', NULL, 2024, 'smartphone', true, 0, '{screen_crack,charging_port}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 20:37:32.166493+00'),
	('995391bb-032c-4ab4-a5b8-4d42d98ba626', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Pro Max', NULL, 2022, 'smartphone', true, 1, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 21:12:02.891693+00'),
	('496ed383-8247-43c8-aa6b-dd0f6afb47f3', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Pro Max', NULL, 2023, 'smartphone', true, 1, '{screen_crack,battery_issue}', NULL, NULL, NULL, NULL, '2025-09-03 20:37:32.166493+00', '2025-09-03 21:29:10.730347+00');


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."services" ("id", "name", "description", "category", "base_price", "estimated_duration_minutes", "requires_parts", "skill_level", "is_active", "sort_order", "created_at", "updated_at") VALUES
	('7049006e-bdf5-4341-9f35-9e29a58bbbf2', 'Screen Replacement', NULL, 'screen_repair', 150.00, 60, true, 'intermediate', true, 1, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('867a6e98-bcbb-49c7-b1cf-e2dd05ce0bbc', 'Battery Replacement', NULL, 'battery_replacement', 80.00, 45, true, 'intermediate', true, 2, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('64705c0c-be60-4cc8-89b9-db4296645b7a', 'Charging Port Repair', NULL, 'charging_port', 90.00, 60, true, 'intermediate', true, 3, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('4e8a5782-2e61-4f95-82ce-715b25887076', 'Water Damage Treatment', NULL, 'water_damage', 120.00, 120, false, 'advanced', true, 4, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('b6ed5fec-65ed-4ba6-b9d4-44b4fc3aaf37', 'Diagnostic Service', NULL, 'diagnostic', 40.00, 30, false, 'basic', true, 5, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('1bec6ce0-eb3d-4f4a-8a22-11356ec54ec5', 'Software Troubleshooting', NULL, 'software_issue', 50.00, 45, false, 'basic', true, 6, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('8603b6c5-cd92-45c5-8063-792d0e5c74b0', 'Camera Module Replacement', NULL, 'camera_repair', 100.00, 60, true, 'intermediate', true, 7, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('8493678f-f3a2-4ff8-a106-000e75d1255c', 'Speaker Replacement', NULL, 'speaker_repair', 70.00, 45, true, 'intermediate', true, 8, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('05f66ffb-e48d-45cd-86a2-d880eed8d42f', 'Power Button Repair', NULL, 'button_repair', 60.00, 45, true, 'intermediate', true, 9, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('f45bb161-089f-49de-b84a-ea1845da3af9', 'Volume Button Repair', NULL, 'button_repair', 60.00, 45, true, 'intermediate', true, 10, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('e6690247-e9be-491b-a4e3-fbf2c447236a', 'Home Button Repair', NULL, 'button_repair', 70.00, 60, true, 'intermediate', true, 11, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('5fe095b0-9661-4d53-922a-e59e44f8733f', 'Motherboard Repair', NULL, 'motherboard_repair', 200.00, 180, true, 'expert', true, 12, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('3ce00a39-7f81-49ce-8b28-01cf61aaa29b', 'Data Recovery', NULL, 'data_recovery', 150.00, 120, false, 'advanced', true, 13, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('ea4a9fc0-de06-4754-9177-f2c7af0c306f', 'Virus Removal', NULL, 'software_issue', 60.00, 60, false, 'basic', true, 14, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00'),
	('c0624a20-10fd-4fea-8ad9-5ced15e316fe', 'OS Installation', NULL, 'software_issue', 80.00, 90, false, 'intermediate', true, 15, '2025-09-04 00:50:43.179348+00', '2025-09-04 00:50:43.179348+00');


--
-- Data for Name: device_services; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "full_name", "role", "created_at", "updated_at") VALUES
	('11111111-1111-1111-1111-111111111111', 'admin@phoneguys.com', 'John Admin', 'admin', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00'),
	('22222222-2222-2222-2222-222222222222', 'tech1@phoneguys.com', 'Sarah Technician', 'technician', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00'),
	('33333333-3333-3333-3333-333333333333', 'tech2@phoneguys.com', 'Mike Repair', 'technician', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00'),
	('44444444-4444-4444-4444-444444444444', 'manager@phoneguys.com', 'Lisa Manager', 'manager', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00');


--
-- Data for Name: repair_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."repair_tickets" ("id", "ticket_number", "customer_id", "assigned_to", "device_brand", "device_model", "serial_number", "imei", "repair_issues", "description", "estimated_cost", "actual_cost", "status", "priority", "total_time_minutes", "is_timer_running", "timer_started_at", "date_received", "estimated_completion", "completed_at", "created_at", "updated_at", "deposit_amount", "device_model_id", "customer_device_id", "device_id") VALUES
	('00000003-0000-0000-0000-000000000003', 'TPG0003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Google', 'Pixel 7', 'GA03924-US', '358240051111110', '{camera_issue,software_issue}', 'Camera app crashes. Needs parts ordered.', 159.99, NULL, 'on_hold', 'medium', 0, false, NULL, '2025-08-31 20:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000005-0000-0000-0000-000000000005', 'TPG0005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'OnePlus', '11', 'OP11-12345', '862012050123456', '{water_damage}', 'Phone fell in water. Not turning on. Customer needs urgent repair for business.', 299.99, NULL, 'new', 'urgent', 0, false, NULL, '2025-09-03 20:07:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000004-0000-0000-0000-000000000004', 'TPG0004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Apple', 'iPhone 13', 'G6TZR9XJKXF9', '353850109074472', '{screen_crack}', 'Screen replacement completed successfully.', 199.99, 189.99, 'completed', 'low', 120, false, NULL, '2025-08-29 20:37:32.202521+00', NULL, '2025-09-01 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000002-0000-0000-0000-000000000002', 'TPG0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Samsung', 'Galaxy S23', 'R3CR40ABCDE', '356938108542179', '{charging_port}', 'Charging port not working properly. Phone charges intermittently.', 89.99, NULL, 'in_progress', 'medium', 45, true, '2025-09-03 18:37:32.202521+00', '2025-09-02 20:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000006-0000-0000-0000-000000000006', 'TPG0006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Apple', 'iPad Pro 12.9', 'DMPWK9XJKXF0', NULL, '{screen_crack,battery_issue}', 'iPad screen shattered. Battery also needs replacement.', 399.99, NULL, 'in_progress', 'high', 0, true, '2025-09-03 19:37:32.202521+00', '2025-09-03 16:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('f4096157-df26-4d46-b15b-9b9dd76c96ec', 'TPG0007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 14 Pro Max', '56165156156156165156', '', '{screen_crack}', 'Screen is cracked. Needs a complete replacement. ', 150.00, 0.00, 'new', 'medium', 0, false, NULL, '2025-09-03 21:12:02.891693+00', NULL, NULL, '2025-09-03 21:12:02.891693+00', '2025-09-03 21:20:37.035812+00', 50.00, '995391bb-032c-4ab4-a5b8-4d42d98ba626', NULL, NULL),
	('9216c0e4-6c4b-45a1-a7be-9cc50b7de8ca', 'TPG0008', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 15 Pro Max', NULL, NULL, '{charging_port,battery_issue}', 'Charging port or battery issues.', 179.99, NULL, 'new', 'medium', 0, false, NULL, '2025-09-03 21:29:10.730347+00', NULL, NULL, '2025-09-03 21:29:10.730347+00', '2025-09-03 21:29:10.730347+00', 0.00, '496ed383-8247-43c8-aa6b-dd0f6afb47f3', NULL, NULL),
	('6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', 'TPG0009', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 16 Pro Max', NULL, NULL, '{screen_crack,battery_issue}', 'Customer dropped phone, broke screen. Also states battery wouldn''t stay charged for long.', 230.00, NULL, 'cancelled', 'medium', 0, false, NULL, '2025-09-04 01:00:46.015029+00', NULL, NULL, '2025-09-04 01:00:46.015029+00', '2025-09-04 01:42:13.32821+00', 0.00, NULL, '1b7929fc-80f1-44d0-b010-0dd1afabcfee', '372358d9-2422-4d30-a6bf-0ac74a393d2c'),
	('00000001-0000-0000-0000-000000000001', 'TPG0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Apple', 'iPhone 14 Pro', 'F2LZK9XJKXF8', '353850109074471', '{screen_crack,battery_issue}', 'Customer reports screen is cracked in upper right corner. Battery drains quickly.', 249.99, 12.00, 'in_progress', 'high', 12, false, NULL, '2025-09-03 18:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-04 02:00:28.040867+00', 0.00, NULL, 'a4e4b744-7f2f-4b6d-bc04-5af5699f04fe', '763b4454-ce8d-4a91-8144-ce0bcdf72ce7'),
	('e4fb826c-764c-447c-a357-2ddb01ce25e1', 'TPG0010', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 16 Pro Max', 'SNLORQSAGU', '305087970722198', '{screen_crack,battery_issue}', 'Customer dropped phone and cracked screen. Reports issues with battery staying charged. Wants us to look into it all. ', 230.00, NULL, 'in_progress', 'medium', 0, false, '2025-09-04 02:01:41.907+00', '2025-09-04 01:07:27.326432+00', NULL, NULL, '2025-09-04 01:07:27.326432+00', '2025-09-04 02:01:41.910097+00', 0.00, NULL, NULL, '372358d9-2422-4d30-a6bf-0ac74a393d2c');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "ticket_id", "notification_type", "recipient_email", "subject", "content", "sent_at", "status", "created_at") VALUES
	('edc56c97-2388-45e5-b29a-a0526a35e9c8', '00000001-0000-0000-0000-000000000001', 'new_ticket', 'admin@phoneguys.com', 'New Repair Ticket: TPG0001', 'A new repair ticket has been created for Alice Johnson - iPhone 14 Pro', '2025-09-03 18:37:32.202521+00', 'sent', '2025-09-03 20:37:32.202521+00'),
	('4cc8a9ab-c8db-4cb0-8022-7ab958510612', '00000004-0000-0000-0000-000000000004', 'completion', 'diana.prince@email.com', 'Your repair is complete!', 'Your iPhone 13 repair has been completed. Please visit our store to pick up your device.', '2025-09-01 20:37:32.202521+00', 'sent', '2025-09-03 20:37:32.202521+00'),
	('7e388daf-b4a1-4dce-a8ba-a10758d07aab', '00000003-0000-0000-0000-000000000003', 'on_hold', 'charlie.brown@email.com', 'Repair Status Update: On Hold', 'Your Pixel 7 repair is currently on hold while we wait for parts. We will update you once parts arrive.', NULL, 'pending', '2025-09-03 20:37:32.202521+00'),
	('75faedf1-65c9-48ab-a82e-17dabaea72b2', '00000005-0000-0000-0000-000000000005', 'new_ticket', 'manager@phoneguys.com', 'URGENT: New Repair Ticket TPG0005', 'An urgent repair ticket has been created for Edward Norton - OnePlus 11 with water damage.', '2025-09-03 20:07:32.202521+00', 'sent', '2025-09-03 20:37:32.202521+00'),
	('b5e13af9-843f-40fd-9b5b-a7d57321c5cf', '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', 'status_change', 'michael@southwellmedia.com', 'Repair Status Update - TPG0009', 'Dear Michael Froseth,\n\nYour repair (TPG0009) has been cancelled. If you have any questions, please contact us.', NULL, 'pending', '2025-09-04 01:02:44.704397+00');


--
-- Data for Name: ticket_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_notes" ("id", "ticket_id", "user_id", "note_type", "content", "is_important", "created_at") VALUES
	('c9517eb5-e533-4ca2-9e13-3e625a013db5', '00000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'internal', 'Customer called to check status. Informed parts are being ordered.', false, '2025-09-03 20:37:32.202521+00'),
	('42711dbc-eca6-4397-8fa4-3018c7a79b0b', '00000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'customer', 'Sent email update to customer about repair timeline.', false, '2025-09-03 20:37:32.202521+00'),
	('c6e07f5d-55d6-4f89-8da8-7892a0e87830', '00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'internal', 'Diagnosed issue - charging port pins are bent. Starting repair.', true, '2025-09-03 20:37:32.202521+00'),
	('069e9d9a-1a8b-4582-8fb4-21de6f7ec8ed', '00000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'internal', 'Camera module needs to be ordered. ETA 3-5 business days.', true, '2025-09-03 20:37:32.202521+00'),
	('fa55b81c-9286-44e0-8ee3-e98d614d802d', '00000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'customer', 'Called customer to inform about parts delay. Customer agreed to wait.', false, '2025-09-03 20:37:32.202521+00'),
	('d6980542-98f9-4cc8-ab7f-c3b781ea7e5a', '00000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'internal', 'Screen replacement completed. Tested all functions - working perfectly.', false, '2025-09-03 20:37:32.202521+00'),
	('54245819-456d-495a-9acc-5988da872d0d', '00000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'internal', 'URGENT: Business customer. Prioritize this repair.', true, '2025-09-03 20:37:32.202521+00'),
	('bc09c73a-d5ed-4f14-93ff-9000e254839c', '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', '11111111-1111-1111-1111-111111111111', 'internal', 'Status changed from new to cancelled', true, '2025-09-04 01:02:44.686157+00');


--
-- Data for Name: ticket_photo_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_photos" ("id", "ticket_id", "file_name", "file_path", "file_size", "mime_type", "uploaded_by", "uploaded_at", "description", "is_before_photo", "is_after_photo", "tags", "service_id", "created_at", "updated_at") VALUES
	('e9832047-868d-4c47-afe1-cda40926e430', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '1756949977896-16-pro-max-BGLASS.webp', 'e4fb826c-764c-447c-a357-2ddb01ce25e1/1756949977896-16-pro-max-BGLASS.webp', 115594, 'image/webp', '11111111-1111-1111-1111-111111111111', '2025-09-04 01:39:37.933+00', '', false, false, '{before,screen-damage}', '7049006e-bdf5-4341-9f35-9e29a58bbbf2', '2025-09-04 01:39:37.936495+00', '2025-09-04 01:39:37.936495+00');


--
-- Data for Name: ticket_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_services" ("id", "ticket_id", "service_id", "quantity", "unit_price", "technician_notes", "performed_by", "performed_at", "created_at") VALUES
	('5a6053b0-194e-4b8f-952a-060c2b93236a', '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', '7049006e-bdf5-4341-9f35-9e29a58bbbf2', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 01:00:46.026024+00'),
	('9da679b1-fa05-43e7-aad2-67bf37f8f760', '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', '867a6e98-bcbb-49c7-b1cf-e2dd05ce0bbc', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 01:00:46.026024+00'),
	('ed1148c4-1e8c-4a13-9e59-5e73876d66f5', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '7049006e-bdf5-4341-9f35-9e29a58bbbf2', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 01:07:27.336223+00'),
	('d90bc542-d5ee-4ac5-a337-cb607c741c27', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '867a6e98-bcbb-49c7-b1cf-e2dd05ce0bbc', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 01:07:27.336223+00');


--
-- Data for Name: time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."time_entries" ("id", "ticket_id", "user_id", "start_time", "end_time", "duration_minutes", "description", "created_at") VALUES
	('82262cb7-135d-447c-a684-a96763a5c496', '00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2025-09-02 20:37:32.202521+00', '2025-09-02 21:22:32.202521+00', 45, 'Initial diagnosis and disassembly', '2025-09-03 20:37:32.202521+00'),
	('4b097d2a-ff35-49fd-94d9-2af502f98fa4', '00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2025-09-03 16:37:32.202521+00', NULL, NULL, 'Repair in progress', '2025-09-03 20:37:32.202521+00'),
	('eabec814-bf34-45ba-9e23-b3a01d910645', '00000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '2025-08-31 20:37:32.202521+00', '2025-08-31 22:37:32.202521+00', 120, 'Complete screen replacement', '2025-09-03 20:37:32.202521+00'),
	('a8934607-6e40-45c1-a446-d1c9084a2257', '00000006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', '2025-09-03 18:37:32.202521+00', NULL, NULL, 'Working on iPad repair', '2025-09-03 20:37:32.202521+00'),
	('36888a69-55bf-432e-9616-9e05d73c7e60', '00000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2025-09-03 21:21:20.608+00', '2025-09-03 21:23:09.686+00', 2, 'Initial diagnosis.', '2025-09-03 21:23:09.689899+00'),
	('c742702d-df44-4f7d-b162-6cdf534ab3f5', '00000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2025-09-03 21:23:17.872+00', '2025-09-03 21:32:47.473+00', 10, 'Will need to order a new screen. The breaking is the screen, not the protector.', '2025-09-03 21:32:47.477648+00');


--
-- Data for Name: user_id_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_id_mapping" ("auth_user_id", "app_user_id", "created_at") VALUES
	('241d165f-cf6c-4836-97ae-8fe1152583d9', '11111111-1111-1111-1111-111111111111', '2025-09-03 21:06:24.439251+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

h