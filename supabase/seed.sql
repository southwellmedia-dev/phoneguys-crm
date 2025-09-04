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
	('00000000-0000-0000-0000-000000000000', '98b7dfc1-a88f-47cb-9893-4ddf05e654a3', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 21:40:12.623712+00', ''),
	('00000000-0000-0000-0000-000000000000', '8dc19039-1e4a-4a24-8b51-b9df4b8a9502', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-04 00:50:48.708752+00', ''),
	('00000000-0000-0000-0000-000000000000', '9537c206-f1e5-4b66-86c5-45b717499c9e', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 01:55:25.692607+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a29d7ce0-00ef-4d18-89e8-f6a3e5e4d61c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 01:55:25.69548+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fd28e4d0-cb11-4bac-a638-1dd7da709117', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-04 03:18:32.494814+00', ''),
	('00000000-0000-0000-0000-000000000000', '6081235d-786a-480b-b4b1-86c3e785d23e', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"0f5a2789-1365-4576-b849-0a21c48a87ac"}}', '2025-09-04 03:19:19.699237+00', ''),
	('00000000-0000-0000-0000-000000000000', '99376356-3065-4bc0-8eb1-24d8e01d5535', '{"action":"user_signedup","actor_id":"0f5a2789-1365-4576-b849-0a21c48a87ac","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 03:25:12.757821+00', ''),
	('00000000-0000-0000-0000-000000000000', '2b5ab7ba-aacf-4aaa-af0a-2d17a2db32c3', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"0f5a2789-1365-4576-b849-0a21c48a87ac","user_phone":""}}', '2025-09-04 03:27:42.324222+00', ''),
	('00000000-0000-0000-0000-000000000000', '3bc227ec-c89a-49e3-ae3e-6df3fd4ac8ad', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"ae2ccc94-276c-4372-8d0f-fcda42f9f8b3"}}', '2025-09-04 03:27:55.699252+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd263cd25-5119-44bc-b05d-e8e1d52caac5', '{"action":"user_signedup","actor_id":"ae2ccc94-276c-4372-8d0f-fcda42f9f8b3","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 03:28:02.994335+00', ''),
	('00000000-0000-0000-0000-000000000000', '37f7467e-6bf3-4d64-bfcc-99c2650a7517', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"ae2ccc94-276c-4372-8d0f-fcda42f9f8b3","user_phone":""}}', '2025-09-04 03:28:31.056795+00', ''),
	('00000000-0000-0000-0000-000000000000', '7e965944-d0c4-4dc7-a99f-be39bc06f142', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"b8a268bb-da40-4e1e-94a9-0cf6e257f30f"}}', '2025-09-04 03:29:59.68242+00', ''),
	('00000000-0000-0000-0000-000000000000', '7a3d2a62-f70c-4409-a288-573fc01d08eb', '{"action":"user_signedup","actor_id":"b8a268bb-da40-4e1e-94a9-0cf6e257f30f","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 03:30:13.996709+00', ''),
	('00000000-0000-0000-0000-000000000000', '953c20fd-4308-47c8-9a12-c0562f2e7b99', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-04 03:32:26.486213+00', ''),
	('00000000-0000-0000-0000-000000000000', '81a21847-9b12-47ea-ba1b-ef156c87b523', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"b8a268bb-da40-4e1e-94a9-0cf6e257f30f","user_phone":""}}', '2025-09-04 03:41:58.77409+00', ''),
	('00000000-0000-0000-0000-000000000000', '1d050478-6d95-4025-92a1-638805860a7d', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-04 03:44:32.187558+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c790ee9d-cdd3-473a-a3a7-dfedc8d0afcc', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"7a29510a-7878-426c-b73b-5bd844025d92"}}', '2025-09-04 03:58:02.676231+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc1696aa-f934-4298-86bf-c1942d544ea2', '{"action":"user_signedup","actor_id":"7a29510a-7878-426c-b73b-5bd844025d92","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 03:58:11.271695+00', ''),
	('00000000-0000-0000-0000-000000000000', '168f168c-61f5-4fe8-bb4d-c3762763e005', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"7a29510a-7878-426c-b73b-5bd844025d92","user_phone":""}}', '2025-09-04 03:58:36.722456+00', ''),
	('00000000-0000-0000-0000-000000000000', '223e2939-7cb7-4649-bc89-8e7f621bb2c1', '{"action":"logout","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account"}', '2025-09-04 04:01:10.05703+00', ''),
	('00000000-0000-0000-0000-000000000000', '22927914-7207-4f1c-ad4b-b301565da56b', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-04 04:01:20.164873+00', ''),
	('00000000-0000-0000-0000-000000000000', '13f7a6c7-f74f-4841-946f-f04deac9f31d', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"2647fddc-94ee-4e99-b065-efa0a56882ae"}}', '2025-09-04 04:01:37.666466+00', ''),
	('00000000-0000-0000-0000-000000000000', '311dc1f8-ce28-4620-9a9a-0c49acb17b02', '{"action":"user_signedup","actor_id":"2647fddc-94ee-4e99-b065-efa0a56882ae","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 04:01:43.660082+00', ''),
	('00000000-0000-0000-0000-000000000000', '071f8c43-f9f3-4b88-9093-eafbf8a976c6', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"2647fddc-94ee-4e99-b065-efa0a56882ae","user_phone":""}}', '2025-09-04 04:02:03.826824+00', ''),
	('00000000-0000-0000-0000-000000000000', '94611fad-55ae-4ed0-ae41-ced6e45fd6f5', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"738f0eb1-b7c8-408d-bd0b-cfd9d8e6e2e3"}}', '2025-09-04 04:02:14.064935+00', ''),
	('00000000-0000-0000-0000-000000000000', '43f5b1a7-c105-4181-8c80-da29402c597b', '{"action":"user_signedup","actor_id":"738f0eb1-b7c8-408d-bd0b-cfd9d8e6e2e3","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 04:02:23.661758+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a327d4f2-65b3-4ec5-80ca-948e81efd385', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"738f0eb1-b7c8-408d-bd0b-cfd9d8e6e2e3","user_phone":""}}', '2025-09-04 04:05:36.521236+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b956a1e0-d1a8-4df8-8e6e-14105bcbb541', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"70454fee-c349-412f-81ef-d1ebf9b77f64"}}', '2025-09-04 04:05:48.60281+00', ''),
	('00000000-0000-0000-0000-000000000000', '7cfa94bc-4538-43ee-964a-6daf11e77eeb', '{"action":"user_signedup","actor_id":"70454fee-c349-412f-81ef-d1ebf9b77f64","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 04:06:06.09561+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b78edf45-2461-4361-a4ab-9891a0daecb5', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"70454fee-c349-412f-81ef-d1ebf9b77f64","user_phone":""}}', '2025-09-04 04:09:33.131764+00', ''),
	('00000000-0000-0000-0000-000000000000', '14450089-cdba-453f-9813-874b535d171b', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"hello@aethercms.com","user_id":"9136a7c4-9535-4493-a5bf-c0c403f24ff0"}}', '2025-09-04 04:11:00.44841+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b6246b40-6344-4230-99ab-631441d6d16b', '{"action":"user_signedup","actor_id":"9136a7c4-9535-4493-a5bf-c0c403f24ff0","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 04:11:16.958439+00', ''),
	('00000000-0000-0000-0000-000000000000', '25ca2d35-7b8d-43f8-958a-aa9cb74c3311', '{"action":"user_updated_password","actor_id":"9136a7c4-9535-4493-a5bf-c0c403f24ff0","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"user"}', '2025-09-04 04:11:25.197275+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb15fb76-32d0-47fa-832a-8ed83675301e', '{"action":"user_modified","actor_id":"9136a7c4-9535-4493-a5bf-c0c403f24ff0","actor_name":"Michael John","actor_username":"hello@aethercms.com","actor_via_sso":false,"log_type":"user"}', '2025-09-04 04:11:25.198071+00', ''),
	('00000000-0000-0000-0000-000000000000', '8e6a1aba-5c6a-4003-bc94-3fe7651e9306', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"andrew@akhdigital.com","user_id":"7b61679a-4523-458b-929e-65a1e80efed3"}}', '2025-09-04 04:16:24.694738+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c7926af7-a1b7-4e6b-84a3-f69e77ef4a0a', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 04:59:32.630473+00', ''),
	('00000000-0000-0000-0000-000000000000', '76f0523a-8749-4677-8e10-d0312747ff15', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 04:59:32.631888+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f2eacdf-419e-4086-8577-64611e43bed8', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 12:05:29.130685+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bca74dba-81ea-4526-a666-8bfd309ca56c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 12:05:29.131878+00', ''),
	('00000000-0000-0000-0000-000000000000', '077aff9f-f795-4506-9e23-40e652c8073e', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-04 12:06:01.613801+00', ''),
	('00000000-0000-0000-0000-000000000000', '584d4167-6111-4699-b795-e8b71c84df85', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 13:04:24.303285+00', ''),
	('00000000-0000-0000-0000-000000000000', '095a3719-d40b-4e0b-88ea-2f0962c231e6', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 13:04:24.304813+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '241d165f-cf6c-4836-97ae-8fe1152583d9', 'authenticated', 'authenticated', 'admin@phoneguys.com', '$2a$10$kd8MjfzGQ/tnK7u3p9I/Bu5WjfWQ3Eyy3K1vsMyepaJwZkJsmae6y', '2025-09-03 20:41:35.686387+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-04 12:06:01.61898+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-09-03 20:41:35.679124+00', '2025-09-04 13:04:24.308079+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', 'authenticated', 'authenticated', 'hello@aethercms.com', '$2a$10$1ULMVwliozPyyTKXvJlEKOuWCiVUAHHbmrIdZkTap4gBnrRa/vUJ2', '2025-09-04 04:11:16.959516+00', '2025-09-04 04:11:00.449568+00', '', NULL, '', NULL, '', '', NULL, '2025-09-04 04:11:16.963424+00', '{"provider": "email", "providers": ["email"]}', '{"role": "admin", "full_name": "Michael John", "email_verified": true, "invited_by_admin": true}', NULL, '2025-09-04 04:11:00.432769+00', '2025-09-04 04:11:25.195768+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '7b61679a-4523-458b-929e-65a1e80efed3', 'authenticated', 'authenticated', 'andrew@akhdigital.com', '', NULL, '2025-09-04 04:16:24.696332+00', 'e8f5f604ab787205551facb0feb4cdf302cf151faed418a955704d2f', '2025-09-04 04:16:24.696332+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"role": "admin", "full_name": "Andrew Hood", "invited_by_admin": true}', NULL, '2025-09-04 04:16:24.688312+00', '2025-09-04 04:16:25.065957+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('241d165f-cf6c-4836-97ae-8fe1152583d9', '241d165f-cf6c-4836-97ae-8fe1152583d9', '{"sub": "241d165f-cf6c-4836-97ae-8fe1152583d9", "email": "admin@phoneguys.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-03 20:41:35.682697+00', '2025-09-03 20:41:35.682728+00', '2025-09-03 20:41:35.682728+00', 'e5b8818a-d28f-49a3-8a7c-d5037a5a4fd3'),
	('9136a7c4-9535-4493-a5bf-c0c403f24ff0', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', '{"sub": "9136a7c4-9535-4493-a5bf-c0c403f24ff0", "email": "hello@aethercms.com", "email_verified": true, "phone_verified": false}', 'email', '2025-09-04 04:11:00.446789+00', '2025-09-04 04:11:00.446896+00', '2025-09-04 04:11:00.446896+00', '3d149507-bf24-47b9-8872-890fcc60da14'),
	('7b61679a-4523-458b-929e-65a1e80efed3', '7b61679a-4523-458b-929e-65a1e80efed3', '{"sub": "7b61679a-4523-458b-929e-65a1e80efed3", "email": "andrew@akhdigital.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-04 04:16:24.693652+00', '2025-09-04 04:16:24.693703+00', '2025-09-04 04:16:24.693703+00', '59a070e2-ce00-4290-b1b7-38c1c2b9884a');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('0de1ee49-30e5-4019-9f22-eb34fb04321d', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', '2025-09-04 04:11:16.963493+00', '2025-09-04 04:11:16.963493+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '98.61.150.165', NULL),
	('9c68da58-8be8-43cd-ba91-ec98d7ad7c48', '241d165f-cf6c-4836-97ae-8fe1152583d9', '2025-09-04 12:06:01.619066+00', '2025-09-04 12:06:01.619066+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '98.61.150.165', NULL),
	('4f510372-e9aa-481e-abb6-4da7fccb40d0', '241d165f-cf6c-4836-97ae-8fe1152583d9', '2025-09-04 04:01:20.165717+00', '2025-09-04 13:04:24.309815+00', NULL, 'aal1', NULL, '2025-09-04 13:04:24.309743', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '98.61.150.165', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('4f510372-e9aa-481e-abb6-4da7fccb40d0', '2025-09-04 04:01:20.168077+00', '2025-09-04 04:01:20.168077+00', 'password', 'e4926d38-d5b3-4f1b-982d-753abc0ca49e'),
	('0de1ee49-30e5-4019-9f22-eb34fb04321d', '2025-09-04 04:11:16.966279+00', '2025-09-04 04:11:16.966279+00', 'otp', '49aaac5f-4a05-4320-9a0c-c7f9e0f404ff'),
	('9c68da58-8be8-43cd-ba91-ec98d7ad7c48', '2025-09-04 12:06:01.622495+00', '2025-09-04 12:06:01.622495+00', 'password', '7581a476-fe9a-4800-b13b-98a9ff2937aa');


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

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('c68f2be5-f37d-4e7d-bf74-b5bd98455c57', '7b61679a-4523-458b-929e-65a1e80efed3', 'confirmation_token', 'e8f5f604ab787205551facb0feb4cdf302cf151faed418a955704d2f', 'andrew@akhdigital.com', '2025-09-04 04:16:25.067986', '2025-09-04 04:16:25.067986');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 16, 'oyxppt2oglpi', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', false, '2025-09-04 04:11:16.964444+00', '2025-09-04 04:11:16.964444+00', NULL, '0de1ee49-30e5-4019-9f22-eb34fb04321d'),
	('00000000-0000-0000-0000-000000000000', 12, 'kixqqjmapn4w', '241d165f-cf6c-4836-97ae-8fe1152583d9', true, '2025-09-04 04:01:20.166668+00', '2025-09-04 04:59:32.632541+00', NULL, '4f510372-e9aa-481e-abb6-4da7fccb40d0'),
	('00000000-0000-0000-0000-000000000000', 17, '5vnec5k7gmfb', '241d165f-cf6c-4836-97ae-8fe1152583d9', true, '2025-09-04 04:59:32.634226+00', '2025-09-04 12:05:29.132518+00', 'kixqqjmapn4w', '4f510372-e9aa-481e-abb6-4da7fccb40d0'),
	('00000000-0000-0000-0000-000000000000', 19, '6gtxzrivf2sd', '241d165f-cf6c-4836-97ae-8fe1152583d9', false, '2025-09-04 12:06:01.620208+00', '2025-09-04 12:06:01.620208+00', NULL, '9c68da58-8be8-43cd-ba91-ec98d7ad7c48'),
	('00000000-0000-0000-0000-000000000000', 18, 'lreflcpvdkwn', '241d165f-cf6c-4836-97ae-8fe1152583d9', true, '2025-09-04 12:05:29.133319+00', '2025-09-04 13:04:24.305526+00', '5vnec5k7gmfb', '4f510372-e9aa-481e-abb6-4da7fccb40d0'),
	('00000000-0000-0000-0000-000000000000', 20, 'azx2lso6jgbd', '241d165f-cf6c-4836-97ae-8fe1152583d9', false, '2025-09-04 13:04:24.306401+00', '2025-09-04 13:04:24.306401+00', 'lreflcpvdkwn', '4f510372-e9aa-481e-abb6-4da7fccb40d0');


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
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."devices" ("id", "manufacturer_id", "model_name", "model_number", "device_type", "release_year", "thumbnail_url", "image_url", "description", "specifications", "screen_size", "storage_options", "color_options", "common_issues", "average_repair_cost", "average_repair_time_hours", "parts_availability", "is_active", "total_repairs_count", "created_at", "updated_at") VALUES
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
	('5b017724-1084-4b81-8ca1-a613882c984c', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S22 Ultra', NULL, 'smartphone', 2022, NULL, '/images/devices/samsung/galaxy-s22-ultra.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.06221+00', '2025-09-04 00:51:12.06221+00'),
	('4a2c2b61-d804-4e7f-804a-e246f706ea5c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 11 Pro', NULL, 'smartphone', 2019, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-11-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.889108+00', '2025-09-04 03:31:24.497699+00'),
	('374e9ed4-6394-47e0-98d9-fc0fbfc8744c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12', NULL, 'smartphone', 2020, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-12.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.865114+00', '2025-09-04 03:31:25.14031+00'),
	('df53021d-125a-4a45-ae06-bbcb9a4d0685', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12 Mini', NULL, 'smartphone', 2020, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-12-mini.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.873604+00', '2025-09-04 03:31:25.42638+00'),
	('12084372-94ac-4731-bb05-6f0c4e455e9e', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12 Pro', NULL, 'smartphone', 2020, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-12-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.857664+00', '2025-09-04 03:31:25.716315+00'),
	('51b9657a-14f5-49f2-9ff7-38da551c6c17', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 12 Pro Max', NULL, 'smartphone', 2020, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-12-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.849873+00', '2025-09-04 03:31:25.935397+00'),
	('353c6276-55a5-40fc-a4c3-4673cb856895', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13', NULL, 'smartphone', 2021, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-13.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.83494+00', '2025-09-04 03:31:26.246835+00'),
	('2a19bd4f-46f9-41b5-a06a-927630f0d517', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13 Pro Max', NULL, 'smartphone', 2021, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-13-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.818855+00', '2025-09-04 03:31:26.792305+00'),
	('e8566206-e592-45e7-9b2a-18ff33551306', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14', NULL, 'smartphone', 2022, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-14.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.810843+00', '2025-09-04 03:31:27.040065+00'),
	('6122f4a8-e9ba-41cc-9710-d25ae10364a5', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13 Pro', NULL, 'smartphone', 2021, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-13-pro.png', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-13-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.827269+00', '2025-09-04 04:58:19.743332+00'),
	('b46db08f-b8a1-4f30-9ec8-e426a8233feb', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Plus', NULL, 'smartphone', 2023, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.767021+00', '2025-09-04 04:19:43.279087+00'),
	('7ed6e2c1-5f1b-4043-a42e-5fc2e3e3a80e', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S23', NULL, 'smartphone', 2023, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/galaxy-s23.png', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/galaxy-s23.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 1, '2025-09-04 00:51:12.053747+00', '2025-09-04 03:55:58.057718+00'),
	('d2ba824d-4590-4348-9992-89b29a87e488', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15', NULL, 'smartphone', 2023, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.777297+00', '2025-09-04 04:19:52.151305+00'),
	('713b037c-ee80-4980-8626-97b322374765', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Pro Max', NULL, 'smartphone', 2022, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-14-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 1, '2025-09-04 00:51:11.785928+00', '2025-09-04 05:10:26.288629+00'),
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
	('3751ce1a-d4e2-46c0-bf2a-8b7b2d16d67a', '72985891-6802-4a2f-bbdd-c8e618b78720', 'Galaxy S21 Ultra', NULL, 'smartphone', 2021, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/galaxy-s21-ultra.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:12.087367+00', '2025-09-04 03:31:23.807529+00'),
	('35c3b906-c38f-4f23-a91c-19160ef36dbf', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 11', NULL, 'smartphone', 2019, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-11.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.897257+00', '2025-09-04 03:31:24.183499+00'),
	('70fead5b-b26e-40be-b30d-f1a22800519d', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 11 Pro Max', NULL, 'smartphone', 2019, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-11-pro-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.881373+00', '2025-09-04 03:31:24.773882+00'),
	('8fe8860d-a8fb-4bd2-bb61-9c984573304d', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 13 Mini', NULL, 'smartphone', 2021, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-13-mini.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.842127+00', '2025-09-04 03:31:26.531844+00'),
	('763b4454-ce8d-4a91-8144-ce0bcdf72ce7', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Pro', NULL, 'smartphone', 2022, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-14-pro.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 1, '2025-09-04 00:51:11.794603+00', '2025-09-04 03:31:27.296079+00'),
	('df2e9185-4bb7-431b-9037-99615d92608c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone XS Max', NULL, 'smartphone', 2018, NULL, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-xs-max.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'limited', true, 0, '2025-09-04 00:51:11.921125+00', '2025-09-04 03:31:28.066246+00'),
	('d28974f7-ca7c-4116-985d-8c44dc2b4332', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Pro Max', NULL, 'smartphone', 2023, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.740854+00', '2025-09-04 04:19:29.235227+00'),
	('372358d9-2422-4d30-a6bf-0ac74a393d2c', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 16 Pro Max', '02A0', 'smartphone', 2024, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-16-pro-max.jpg', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, NULL, true, 2, '2025-09-04 00:56:58.893061+00', '2025-09-04 04:19:17.434818+00'),
	('c5a0aba7-2f69-44bb-af69-76e3d1136c87', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 15 Pro', NULL, 'smartphone', 2023, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/gallery-1756959555002.jpg', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.755191+00', '2025-09-04 04:19:36.491009+00'),
	('80c45429-8436-4c9c-ad20-7ae09bd36ebd', 'd2de89aa-1d2f-409e-8d2d-b41b468a7efb', 'iPhone 14 Plus', NULL, 'smartphone', 2022, 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-14-plus.png', 'https://egotypldqzdzjclikmeg.supabase.co/storage/v1/object/public/device-images/iphone-14-plus.png', NULL, '{}', NULL, '{}', '{}', '{}', NULL, NULL, 'available', true, 0, '2025-09-04 00:51:11.802789+00', '2025-09-04 04:57:56.704733+00');


--
-- Data for Name: customer_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customer_devices" ("id", "customer_id", "device_id", "serial_number", "imei", "color", "storage_size", "nickname", "purchase_date", "warranty_expires", "condition", "previous_repairs", "notes", "is_primary", "is_active", "created_at", "updated_at") VALUES
	('4da971fa-45eb-4e9b-af33-e03f7a358c6e', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '372358d9-2422-4d30-a6bf-0ac74a393d2c', 'SNLORQSAGU', '305087970722198', 'White', '32GB', NULL, NULL, NULL, 'broken', '[]', NULL, true, true, '2025-09-04 01:07:26.902001+00', '2025-09-04 01:30:24.913735+00'),
	('1b7929fc-80f1-44d0-b010-0dd1afabcfee', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '372358d9-2422-4d30-a6bf-0ac74a393d2c', 'SND1SIK97J', '918278985913105', 'Silver', '64GB', NULL, NULL, NULL, NULL, '[]', NULL, false, true, '2025-09-04 01:42:13.319289+00', '2025-09-04 01:42:13.319289+00'),
	('a4e4b744-7f2f-4b6d-bc04-5af5699f04fe', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '763b4454-ce8d-4a91-8144-ce0bcdf72ce7', 'F2LZK9XJKXF8', '353850109074471', 'Silver', '32GB', NULL, NULL, NULL, 'poor', '[]', NULL, true, true, '2025-09-04 02:00:28.032215+00', '2025-09-04 02:00:46.155025+00'),
	('74947b2d-e133-4bf3-a63d-a16fda417ccf', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '7ed6e2c1-5f1b-4043-a42e-5fc2e3e3a80e', 'R3CR40ABCDE', '356938108542179', 'White', '64GB', NULL, NULL, NULL, 'poor', '[]', NULL, true, true, '2025-09-04 03:55:21.906681+00', '2025-09-04 04:35:37.413396+00'),
	('f8eef5d3-cee1-43dc-a213-d35ce733b212', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '713b037c-ee80-4980-8626-97b322374765', 'SNA75Q5ALE', '451542591652440', 'Gold', '32GB', NULL, NULL, NULL, NULL, '[]', NULL, false, true, '2025-09-04 05:10:52.624425+00', '2025-09-04 05:10:52.624425+00'),
	('494aede7-bfae-49b8-8a78-17ada23ed483', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '713b037c-ee80-4980-8626-97b322374765', 'SNKM7FVOI4', '117190356708916', 'White', '32GB', NULL, NULL, NULL, NULL, '[]', NULL, false, true, '2025-09-04 05:11:11.64194+00', '2025-09-04 05:11:11.64194+00'),
	('7e4132a3-6a07-4d88-a697-394be419edef', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '713b037c-ee80-4980-8626-97b322374765', 'SNICANU7CZ', '886192510571788', 'Gold', '32GB', NULL, NULL, NULL, 'poor', '[]', NULL, false, true, '2025-09-04 05:10:36.853289+00', '2025-09-04 05:11:43.752757+00');


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
--

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
	('44444444-4444-4444-4444-444444444444', 'manager@phoneguys.com', 'Lisa Manager', 'manager', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00'),
	('9136a7c4-9535-4493-a5bf-c0c403f24ff0', 'hello@aethercms.com', 'Michael John', 'admin', '2025-09-04 04:11:00.432352+00', '2025-09-04 04:11:00.432352+00'),
	('7b61679a-4523-458b-929e-65a1e80efed3', 'andrew@akhdigital.com', 'Andrew Hood', 'admin', '2025-09-04 04:16:24.687806+00', '2025-09-04 04:16:24.687806+00');


--
-- Data for Name: repair_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."repair_tickets" ("id", "ticket_number", "customer_id", "assigned_to", "device_brand", "device_model", "serial_number", "imei", "repair_issues", "description", "estimated_cost", "actual_cost", "status", "priority", "total_time_minutes", "is_timer_running", "timer_started_at", "date_received", "estimated_completion", "completed_at", "created_at", "updated_at", "deposit_amount", "device_model_id", "customer_device_id", "device_id") VALUES
	('00000003-0000-0000-0000-000000000003', 'TPG0003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Google', 'Pixel 7', 'GA03924-US', '358240051111110', '{camera_issue,software_issue}', 'Camera app crashes. Needs parts ordered.', 159.99, NULL, 'on_hold', 'medium', 0, false, NULL, '2025-08-31 20:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000005-0000-0000-0000-000000000005', 'TPG0005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'OnePlus', '11', 'OP11-12345', '862012050123456', '{water_damage}', 'Phone fell in water. Not turning on. Customer needs urgent repair for business.', 299.99, NULL, 'new', 'urgent', 0, false, NULL, '2025-09-03 20:07:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000004-0000-0000-0000-000000000004', 'TPG0004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Apple', 'iPhone 13', 'G6TZR9XJKXF9', '353850109074472', '{screen_crack}', 'Screen replacement completed successfully.', 199.99, 189.99, 'completed', 'low', 120, false, NULL, '2025-08-29 20:37:32.202521+00', NULL, '2025-09-01 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('00000006-0000-0000-0000-000000000006', 'TPG0006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Apple', 'iPad Pro 12.9', 'DMPWK9XJKXF0', NULL, '{screen_crack,battery_issue}', 'iPad screen shattered. Battery also needs replacement.', 399.99, NULL, 'in_progress', 'high', 0, true, '2025-09-03 19:37:32.202521+00', '2025-09-03 16:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-03 20:37:32.202521+00', 0.00, NULL, NULL, NULL),
	('9216c0e4-6c4b-45a1-a7be-9cc50b7de8ca', 'TPG0008', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 15 Pro Max', NULL, NULL, '{charging_port,battery_issue}', 'Charging port or battery issues.', 179.99, NULL, 'new', 'medium', 0, false, NULL, '2025-09-03 21:29:10.730347+00', NULL, NULL, '2025-09-03 21:29:10.730347+00', '2025-09-03 21:29:10.730347+00', 0.00, '496ed383-8247-43c8-aa6b-dd0f6afb47f3', NULL, NULL),
	('6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', 'TPG0009', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 16 Pro Max', NULL, NULL, '{screen_crack,battery_issue}', 'Customer dropped phone, broke screen. Also states battery wouldn''t stay charged for long.', 230.00, NULL, 'cancelled', 'medium', 0, false, NULL, '2025-09-04 01:00:46.015029+00', NULL, NULL, '2025-09-04 01:00:46.015029+00', '2025-09-04 01:42:13.32821+00', 0.00, NULL, '1b7929fc-80f1-44d0-b010-0dd1afabcfee', '372358d9-2422-4d30-a6bf-0ac74a393d2c'),
	('00000001-0000-0000-0000-000000000001', 'TPG0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Apple', 'iPhone 14 Pro', 'F2LZK9XJKXF8', '353850109074471', '{screen_crack,battery_issue}', 'Customer reports screen is cracked in upper right corner. Battery drains quickly.', 249.99, 12.00, 'in_progress', 'high', 12, false, NULL, '2025-09-03 18:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-04 02:00:28.040867+00', 0.00, NULL, 'a4e4b744-7f2f-4b6d-bc04-5af5699f04fe', '763b4454-ce8d-4a91-8144-ce0bcdf72ce7'),
	('f4096157-df26-4d46-b15b-9b9dd76c96ec', 'TPG0007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 14 Pro Max', '', '', '{screen_crack}', 'Screen is cracked. Needs a complete replacement. ', 150.00, 0.00, 'new', 'medium', 0, false, NULL, '2025-09-03 21:12:02.891693+00', NULL, NULL, '2025-09-03 21:12:02.891693+00', '2025-09-04 05:11:11.71001+00', 50.00, '995391bb-032c-4ab4-a5b8-4d42d98ba626', '494aede7-bfae-49b8-8a78-17ada23ed483', '713b037c-ee80-4980-8626-97b322374765'),
	('e4fb826c-764c-447c-a357-2ddb01ce25e1', 'TPG0010', '486abf9d-fe13-4fb1-a05e-38bae0be1bb4', '11111111-1111-1111-1111-111111111111', 'Apple', 'iPhone 16 Pro Max', 'SNLORQSAGU', '305087970722198', '{screen_crack,battery_issue}', 'Customer dropped phone and cracked screen. Reports issues with battery staying charged. Wants us to look into it all. ', 230.00, 437.00, 'in_progress', 'medium', 437, false, NULL, '2025-09-04 01:07:27.326432+00', NULL, NULL, '2025-09-04 01:07:27.326432+00', '2025-09-04 12:15:32.444281+00', 0.00, NULL, NULL, '372358d9-2422-4d30-a6bf-0ac74a393d2c'),
	('00000002-0000-0000-0000-000000000002', 'TPG0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Samsung', 'Galaxy S23', 'R3CR40ABCDE', '356938108542179', '{charging_port,screen_crack}', 'Charging port not working properly. Phone charges intermittently.', 89.99, 57.00, 'in_progress', 'medium', 57, true, NULL, '2025-09-02 20:37:32.202521+00', NULL, NULL, '2025-09-03 20:37:32.202521+00', '2025-09-04 04:39:20.232463+00', 0.00, NULL, '74947b2d-e133-4bf3-a63d-a16fda417ccf', '7ed6e2c1-5f1b-4043-a42e-5fc2e3e3a80e');


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
	('2a2b1ab7-399b-43b1-b1e4-022e96f3e3cd', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '1756957026220-16-pro-max-BGLASS.webp', 'e4fb826c-764c-447c-a357-2ddb01ce25e1/1756957026220-16-pro-max-BGLASS.webp', 115594, 'image/webp', '11111111-1111-1111-1111-111111111111', '2025-09-04 03:37:06.511+00', '', false, false, '{before,screen-damage}', 'a69b3f2b-39fb-4840-8605-db8061683a28', '2025-09-04 03:37:06.533491+00', '2025-09-04 03:37:06.533491+00'),
	('b9acecc3-14a4-4c11-8ecd-21d936367260', '00000002-0000-0000-0000-000000000002', '1756959348136-dropped-my-s23u-back-is-cracked-but-the-screen-is-intact-v0-w7ccpynri6cb1.webp', '00000002-0000-0000-0000-000000000002/1756959348136-dropped-my-s23u-back-is-cracked-but-the-screen-is-intact-v0-w7ccpynri6cb1.webp', 155950, 'image/webp', '11111111-1111-1111-1111-111111111111', '2025-09-04 04:15:48.511+00', '', false, false, '{before,damage,screen-damage}', 'a69b3f2b-39fb-4840-8605-db8061683a28', '2025-09-04 04:15:48.533054+00', '2025-09-04 04:15:48.533054+00');


--
-- Data for Name: ticket_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_services" ("id", "ticket_id", "service_id", "quantity", "unit_price", "technician_notes", "performed_by", "performed_at", "created_at") VALUES
	('5a6053b0-194e-4b8f-952a-060c2b93236a', '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', '7049006e-bdf5-4341-9f35-9e29a58bbbf2', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 01:00:46.026024+00'),
	('9da679b1-fa05-43e7-aad2-67bf37f8f760', '6e2d2fed-f8a5-4c45-ab87-9dc26ac2040e', '867a6e98-bcbb-49c7-b1cf-e2dd05ce0bbc', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 01:00:46.026024+00'),
	('0fb9e084-349b-4b0f-8cd3-ac46bd5ffeb0', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', 'a69b3f2b-39fb-4840-8605-db8061683a28', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 03:36:41.064802+00'),
	('8d7ff1a1-a1df-4905-a189-7bfb5884252e', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '9df771e2-16d4-45a4-a856-5bd41f07e1ef', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 03:36:41.064802+00'),
	('5c31d150-da08-4d2f-b658-dfba7f25af80', '00000002-0000-0000-0000-000000000002', '1b3e3066-c874-4133-89ff-8876df3469af', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 04:15:29.305723+00'),
	('e55dc0a9-d0ed-4195-9f6e-bba107648528', '00000002-0000-0000-0000-000000000002', 'a69b3f2b-39fb-4840-8605-db8061683a28', 1, NULL, NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-09-04 04:15:29.305723+00');


--
-- Data for Name: time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."time_entries" ("id", "ticket_id", "user_id", "start_time", "end_time", "duration_minutes", "description", "created_at") VALUES
	('82262cb7-135d-447c-a684-a96763a5c496', '00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2025-09-02 20:37:32.202521+00', '2025-09-02 21:22:32.202521+00', 45, 'Initial diagnosis and disassembly', '2025-09-03 20:37:32.202521+00'),
	('eabec814-bf34-45ba-9e23-b3a01d910645', '00000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '2025-08-31 20:37:32.202521+00', '2025-08-31 22:37:32.202521+00', 120, 'Complete screen replacement', '2025-09-03 20:37:32.202521+00'),
	('36888a69-55bf-432e-9616-9e05d73c7e60', '00000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2025-09-03 21:21:20.608+00', '2025-09-03 21:23:09.686+00', 2, 'Initial diagnosis.', '2025-09-03 21:23:09.689899+00'),
	('c742702d-df44-4f7d-b162-6cdf534ab3f5', '00000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2025-09-03 21:23:17.872+00', '2025-09-03 21:32:47.473+00', 10, 'Will need to order a new screen. The breaking is the screen, not the protector.', '2025-09-03 21:32:47.477648+00'),
	('863dd819-784e-4cc2-8db9-a1296b123d5e', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '11111111-1111-1111-1111-111111111111', '2025-09-04 03:44:09.554+00', '2025-09-04 03:45:40.919+00', 2, 'Timer test', '2025-09-04 03:45:40.976847+00'),
	('f7bd81b3-0225-4b62-8fad-f50773afe6a3', '00000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '2025-09-04 04:27:30.582+00', '2025-09-04 04:39:20.053+00', 12, 'Initial consultation', '2025-09-04 04:39:20.100285+00'),
	('16b30ba1-e613-4f99-9be6-b0a42fffdb78', 'e4fb826c-764c-447c-a357-2ddb01ce25e1', '11111111-1111-1111-1111-111111111111', '2025-09-04 05:01:12.828+00', '2025-09-04 12:15:32.063+00', 435, 'A long session repairing his device.', '2025-09-04 12:15:32.133677+00');


--
-- Data for Name: user_id_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_id_mapping" ("auth_user_id", "app_user_id", "created_at") VALUES
	('241d165f-cf6c-4836-97ae-8fe1152583d9', '11111111-1111-1111-1111-111111111111', '2025-09-03 21:06:24.439251+00');


--
--

--
--



--
--

--
--

--
--



--
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 20, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;

-- Test Appointments Data (Local Development)
INSERT INTO appointments (
  customer_id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  issues,
  description,
  urgency,
  source,
  notes
) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + interval '1 day', '10:00:00', 30, 'scheduled', ARRAY['screen_crack'], 'Customer reports cracked screen after dropping phone', 'scheduled', 'website', 'Customer prefers morning appointments'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE + interval '2 days', '14:30:00', 45, 'scheduled', ARRAY['battery_issue', 'charging_port'], 'Phone not holding charge', 'scheduled', 'phone', 'Customer will bring original charger'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE, '16:00:00', 30, 'confirmed', ARRAY['water_damage'], 'Phone fell in pool', 'emergency', 'walk-in', 'Urgent - customer needs phone for work'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE, '09:00:00', 30, 'arrived', ARRAY['software_issue'], 'Phone keeps restarting', 'scheduled', 'phone', 'Customer arrived on time'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - interval '1 day', '11:00:00', 30, 'no_show', ARRAY['screen_crack', 'battery_issue'], 'Multiple issues', 'scheduled', 'website', 'Customer did not show up'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE + interval '7 days', '15:00:00', 60, 'scheduled', ARRAY['screen_crack', 'camera_issue'], 'Screen cracked and camera not focusing', 'scheduled', 'email', 'Customer emailed for appointment')
ON CONFLICT DO NOTHING;
