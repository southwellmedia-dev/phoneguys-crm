SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '754e757f-f6ee-4f0e-976d-78b6df832b8e', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin@phoneguys.com","user_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","user_phone":""}}', '2025-09-03 20:41:35.684113+00', ''),
	('00000000-0000-0000-0000-000000000000', '32f910c4-0183-4879-a24c-55da99bb32a3', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-03 20:41:45.942838+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c1237e6e-12b2-4cd1-abe3-de27eb126d58', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 21:40:12.621464+00', ''),
	('00000000-0000-0000-0000-000000000000', '98b7dfc1-a88f-47cb-9893-4ddf05e654a3', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 21:40:12.623712+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '241d165f-cf6c-4836-97ae-8fe1152583d9', 'authenticated', 'authenticated', 'admin@phoneguys.com', '$2a$10$kd8MjfzGQ/tnK7u3p9I/Bu5WjfWQ3Eyy3K1vsMyepaJwZkJsmae6y', '2025-09-03 20:41:35.686387+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-03 20:41:45.943658+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-09-03 20:41:35.679124+00', '2025-09-03 21:40:12.628789+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('241d165f-cf6c-4836-97ae-8fe1152583d9', '241d165f-cf6c-4836-97ae-8fe1152583d9', '{"sub": "241d165f-cf6c-4836-97ae-8fe1152583d9", "email": "admin@phoneguys.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-03 20:41:35.682697+00', '2025-09-03 20:41:35.682728+00', '2025-09-03 20:41:35.682728+00', 'e5b8818a-d28f-49a3-8a7c-d5037a5a4fd3');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('d9b541a3-f972-4a0c-b72f-c9fb7891f0bf', '241d165f-cf6c-4836-97ae-8fe1152583d9', '2025-09-03 20:41:45.943749+00', '2025-09-03 21:40:12.630888+00', NULL, 'aal1', NULL, '2025-09-03 21:40:12.630833', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '172.18.0.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('d9b541a3-f972-4a0c-b72f-c9fb7891f0bf', '2025-09-03 20:41:45.947656+00', '2025-09-03 20:41:45.947656+00', 'password', 'c0314ba8-a604-4d88-afb8-7ac640298ef4');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, '275645i3ulcl', '241d165f-cf6c-4836-97ae-8fe1152583d9', true, '2025-09-03 20:41:45.94541+00', '2025-09-03 21:40:12.624498+00', NULL, 'd9b541a3-f972-4a0c-b72f-c9fb7891f0bf'),
	('00000000-0000-0000-0000-000000000000', 2, 'otjluyk5vshf', '241d165f-cf6c-4836-97ae-8fe1152583d9', false, '2025-09-03 21:40:12.626927+00', '2025-09-03 21:40:12.626927+00', '275645i3ulcl', 'd9b541a3-f972-4a0c-b72f-c9fb7891f0bf');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "name", "email", "phone", "created_at", "updated_at", "address", "city", "state", "zip_code", "notes", "total_orders", "total_spent", "is_active") VALUES
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

INSERT INTO "public"."repair_tickets" ("id", "ticket_number", "customer_id", "assigned_to", "device_brand", "device_model", "serial_number", "imei", "repair_issues", "description", "estimated_cost", "actual_cost", "status", "priority", "total_time_minutes", "is_timer_running", "timer_started_at", "date_received", "estimated_completion", "completed_at", "created_at", "updated_at", "device_model_id", "deposit_amount") VALUES
	('00000003-0000-0000-0000-000000000003', 'TPG0003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Google', 'Pixel 7', 'GA03924-US', '358240051111110', '{camera_issue,software_issue}', 'Camera app crashes. Needs parts ordered.', 159.99, NULL, 'on_hold', 'medium', 0, false, NULL, '2025-08-31 20:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, 0.00),
	('00000005-0000-0000-0000-000000000005', 'TPG0005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'OnePlus', '11', 'OP11-12345', '862012050123456', '{water_damage}', 'Phone fell in water. Not turning on. Customer needs urgent repair for business.', 299.99, NULL, 'new', 'urgent', 0, false, NULL, '2025-09-03 20:07:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, 0.00),
	('00000004-0000-0000-0000-000000000004', 'TPG0004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Apple', 'iPhone 13', 'G6TZR9XJKXF9', '353850109074472', '{screen_crack}', 'Screen replacement completed successfully.', 199.99, 189.99, 'completed', 'low', 120, false, NULL, '2025-08-29 20:37:32.202521+00', NULL, '2025-09-01 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, 0.00),
	('00000002-0000-0000-0000-000000000002', 'TPG0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Samsung', 'Galaxy S23', 'R3CR40ABCDE', '356938108542179', '{charging_port}', 'Charging port not working properly. Phone charges intermittently.', 89.99, NULL, 'in_progress', 'medium', 45, true, '2025-09-03 18:37:32.202521+00', '2025-09-02 20:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, 0.00),
	('00000006-0000-0000-0000-000000000006', 'TPG0006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Apple', 'iPad Pro 12.9', 'DMPWK9XJKXF0', NULL, '{screen_crack,battery_issue}', 'iPad screen shattered. Battery also needs replacement.', 399.99, NULL, 'in_progress', 'high', 0, true, '2025-09-03 19:37:32.202521+00', '2025-09-03 16:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', NULL, 0.00),
	('f4096157-df26-4d46-b15b-9b9dd76c96ec', 'TPG0007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 14 Pro Max', '56165156156156165156', '', '{screen_crack}', 'Screen is cracked. Needs a complete replacement. ', 150.00, 0.00, 'new', 'medium', 0, false, NULL, '2025-09-03 21:12:02.891693+00', NULL, NULL, '2025-09-03 21:12:02.891693+00', '2025-09-03 21:20:37.035812+00', '995391bb-032c-4ab4-a5b8-4d42d98ba626', 50.00),
	('9216c0e4-6c4b-45a1-a7be-9cc50b7de8ca', 'TPG0008', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 15 Pro Max', NULL, NULL, '{charging_port,battery_issue}', 'Charging port or battery issues.', 179.99, NULL, 'new', 'medium', 0, false, NULL, '2025-09-03 21:29:10.730347+00', NULL, NULL, '2025-09-03 21:29:10.730347+00', '2025-09-03 21:29:10.730347+00', '496ed383-8247-43c8-aa6b-dd0f6afb47f3', 0.00),
	('00000001-0000-0000-0000-000000000001', 'TPG0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Apple', 'iPhone 14 Pro', 'F2LZK9XJKXF8', '353850109074471', '{screen_crack,battery_issue}', 'Customer reports screen is cracked in upper right corner. Battery drains quickly.', 249.99, 12.00, 'in_progress', 'high', 12, false, NULL, '2025-09-03 18:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 21:32:47.507507+00', NULL, 0.00);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "ticket_id", "notification_type", "recipient_email", "subject", "content", "sent_at", "status", "created_at") VALUES
	('edc56c97-2388-45e5-b29a-a0526a35e9c8', '00000001-0000-0000-0000-000000000001', 'new_ticket', 'admin@phoneguys.com', 'New Repair Ticket: TPG0001', 'A new repair ticket has been created for Alice Johnson - iPhone 14 Pro', '2025-09-03 18:37:32.202521+00', 'sent', '2025-09-03 20:37:32.202521+00'),
	('4cc8a9ab-c8db-4cb0-8022-7ab958510612', '00000004-0000-0000-0000-000000000004', 'completion', 'diana.prince@email.com', 'Your repair is complete!', 'Your iPhone 13 repair has been completed. Please visit our store to pick up your device.', '2025-09-01 20:37:32.202521+00', 'sent', '2025-09-03 20:37:32.202521+00'),
	('7e388daf-b4a1-4dce-a8ba-a10758d07aab', '00000003-0000-0000-0000-000000000003', 'on_hold', 'charlie.brown@email.com', 'Repair Status Update: On Hold', 'Your Pixel 7 repair is currently on hold while we wait for parts. We will update you once parts arrive.', NULL, 'pending', '2025-09-03 20:37:32.202521+00'),
	('75faedf1-65c9-48ab-a82e-17dabaea72b2', '00000005-0000-0000-0000-000000000005', 'new_ticket', 'manager@phoneguys.com', 'URGENT: New Repair Ticket TPG0005', 'An urgent repair ticket has been created for Edward Norton - OnePlus 11 with water damage.', '2025-09-03 20:07:32.202521+00', 'sent', '2025-09-03 20:37:32.202521+00');


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
	('54245819-456d-495a-9acc-5988da872d0d', '00000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'internal', 'URGENT: Business customer. Prioritize this repair.', true, '2025-09-03 20:37:32.202521+00');


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



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 2, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
