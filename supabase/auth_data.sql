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
	('00000000-0000-0000-0000-000000000000', '095a3719-d40b-4e0b-88ea-2f0962c231e6', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 13:04:24.304813+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e8e11bc6-33c7-494a-ac2e-dc843ac3178a', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 14:02:55.353046+00', ''),
	('00000000-0000-0000-0000-000000000000', '6908294b-6b0f-4bac-a325-dc5649dad8b8', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 14:02:55.354511+00', ''),
	('00000000-0000-0000-0000-000000000000', '8e3f7d92-d52f-4eb5-8422-4a2e7d572199', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 15:01:00.122841+00', ''),
	('00000000-0000-0000-0000-000000000000', '16352667-1711-4623-b36a-e5cdcfa84340', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 15:01:00.134523+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b3d1b23a-6af4-4fe4-bea9-bf4823e06d39', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 16:47:05.614301+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d526991-8772-4a51-8f9e-4f1fe47d1055', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 16:47:05.615796+00', ''),
	('00000000-0000-0000-0000-000000000000', '19048e30-772c-43d8-8f1b-0ca2973a4db9', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 16:47:06.728692+00', ''),
	('00000000-0000-0000-0000-000000000000', '9777ca46-d717-455d-beb9-e714021a43b0', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 17:45:25.061737+00', ''),
	('00000000-0000-0000-0000-000000000000', '289d982d-ca00-4788-a118-0d2201c35b84', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 17:45:25.063008+00', ''),
	('00000000-0000-0000-0000-000000000000', '05407e77-b45b-4008-b0fe-bd0c68cecda3', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"andrew@akhdigital.com","user_id":"7b61679a-4523-458b-929e-65a1e80efed3","user_phone":""}}', '2025-09-04 17:51:50.635094+00', ''),
	('00000000-0000-0000-0000-000000000000', '0b881341-9e20-4f26-adaa-938521978b0b', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"andrew@akhdigital.com","user_id":"821cf797-33bb-4022-b172-ffd2794a0fdf"}}', '2025-09-04 17:52:01.684007+00', ''),
	('00000000-0000-0000-0000-000000000000', 'df2a37a5-9720-454b-bade-1f0b2b571cd9', '{"action":"user_signedup","actor_id":"821cf797-33bb-4022-b172-ffd2794a0fdf","actor_name":"Andrew Hood","actor_username":"andrew@akhdigital.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-04 17:54:16.620626+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd282c3e1-7192-4888-998d-cdde386a7e2e', '{"action":"user_updated_password","actor_id":"821cf797-33bb-4022-b172-ffd2794a0fdf","actor_name":"Andrew Hood","actor_username":"andrew@akhdigital.com","actor_via_sso":false,"log_type":"user"}', '2025-09-04 17:54:58.358146+00', ''),
	('00000000-0000-0000-0000-000000000000', '3bb216d5-2860-4980-be35-f5206c95445f', '{"action":"user_modified","actor_id":"821cf797-33bb-4022-b172-ffd2794a0fdf","actor_name":"Andrew Hood","actor_username":"andrew@akhdigital.com","actor_via_sso":false,"log_type":"user"}', '2025-09-04 17:54:58.359045+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f551732-f184-40c0-81d8-0014336c8ef9', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 19:05:25.787607+00', ''),
	('00000000-0000-0000-0000-000000000000', '810b0730-b818-450a-bf8c-9e2f84e1f6b5', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 19:05:25.788652+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ddc84c1-3c57-43e4-996f-b91ba2b6d42d', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 20:36:07.863816+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c1f198c1-5844-4815-99b6-fd539f8e09f3', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 20:36:07.865294+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e8e7e6be-cc75-4509-aab5-653cbea7c0f9', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 22:43:39.340532+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ef663cd3-f53e-48d0-af81-d78755a74571', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 22:43:39.341584+00', ''),
	('00000000-0000-0000-0000-000000000000', '84bb879d-9e41-4f74-a80e-ec1a6ef34e5a', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 23:45:38.99595+00', ''),
	('00000000-0000-0000-0000-000000000000', '13de883d-4480-4069-b7a0-032fd3a83dd1', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-04 23:45:38.997325+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e6e073e-5eab-499a-94b8-aaa4ddc82715', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 00:43:52.388832+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aaba0231-faad-4267-8047-b2bbceeccb87', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 00:43:52.39013+00', ''),
	('00000000-0000-0000-0000-000000000000', '27d825e5-6e9e-47da-b866-6a41c62cbdfc', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 02:00:20.842468+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2fcdf26-de77-42df-9ce4-a4d9acaa2b2c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 02:00:20.843546+00', ''),
	('00000000-0000-0000-0000-000000000000', '636a1467-6915-4281-963e-ed56128d6bd9', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 02:58:25.870139+00', ''),
	('00000000-0000-0000-0000-000000000000', '0f0a90d4-9598-4a1b-b4a8-6b1777d3d0fe', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 02:58:25.871457+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd64c2014-58dd-4780-8351-2a0e8bf66245', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 11:33:14.685244+00', ''),
	('00000000-0000-0000-0000-000000000000', '812aed9a-3433-4670-95d6-848c5517f8de', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 11:33:14.686269+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a9e4beb-13f0-49f6-8c58-98ce4729b945', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 12:18:05.482112+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f9cfb2a-f81e-47c1-bf37-33bef69b46f6', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 12:18:05.483628+00', ''),
	('00000000-0000-0000-0000-000000000000', '8a916a90-7560-4f53-982a-68d27a4bd93d', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 12:32:30.341712+00', ''),
	('00000000-0000-0000-0000-000000000000', '5470f542-e884-4554-bd5b-84e18a9db95d', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 12:32:30.343271+00', ''),
	('00000000-0000-0000-0000-000000000000', '57a5014a-c7ce-4546-a769-c803872390b0', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 13:16:17.219121+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa8ba887-e7d6-4295-b539-0e8ddb368a0e', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 13:16:17.221067+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dda219fa-6dca-415e-80df-8d6691fae963', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 13:31:41.804607+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e09bc5bd-2f4d-4d6d-82cf-45ebeb8ca36f', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 13:31:41.805681+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a1705710-0770-4593-b65d-afbfb944e182', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 14:14:34.311312+00', ''),
	('00000000-0000-0000-0000-000000000000', '92e133c0-4b1d-4502-a90f-1d88f43da6b0', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 14:14:34.312417+00', ''),
	('00000000-0000-0000-0000-000000000000', '25e30160-ba47-465a-a081-f64d55783734', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 14:30:41.837721+00', ''),
	('00000000-0000-0000-0000-000000000000', '1b3e4f12-c832-46ef-8f27-a8fd54b4ebb6', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 14:30:41.839031+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ac75213-75cc-44f6-b276-6d84893ec445', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 15:13:08.848874+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fda61c57-fd58-4bec-813d-809a763fbb16', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 15:13:08.84999+00', ''),
	('00000000-0000-0000-0000-000000000000', '82cf2f1a-ef05-4868-a148-1f111983a32d', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 15:29:41.807672+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e13a043-b9fc-4f58-99cd-6eca77c8580a', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 15:29:41.80893+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a9d0fbc-0147-43cd-a227-85afcb1f3e3b', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 16:11:22.759274+00', ''),
	('00000000-0000-0000-0000-000000000000', '726a7463-1687-4e21-a8f0-7163f47107bc', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 16:11:22.761215+00', ''),
	('00000000-0000-0000-0000-000000000000', '4422c6f6-51d7-4ca6-aee8-fcd07ff65cfc', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 16:28:41.77217+00', ''),
	('00000000-0000-0000-0000-000000000000', '6285d827-62a8-423c-a866-cc48a270c9c0', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 16:28:41.773649+00', ''),
	('00000000-0000-0000-0000-000000000000', '2068983c-0f7e-4e86-9400-050de6f27c6f', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 17:09:46.934331+00', ''),
	('00000000-0000-0000-0000-000000000000', '6953d513-3109-44bd-9ea6-498b3630d654', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 17:09:46.935551+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e5f2be68-a124-4508-8b78-aa11e211957e', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 17:27:41.939911+00', ''),
	('00000000-0000-0000-0000-000000000000', '5654ff3f-fb09-44e1-b072-b3cefd7ab16c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 17:27:41.941361+00', ''),
	('00000000-0000-0000-0000-000000000000', '490161e3-e273-42ce-8320-6513cc6db451', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 18:08:14.237233+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f0101fc-088e-4dcb-89c7-e7936c39eaf8', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 18:08:14.238277+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a01ff68-f7a8-462f-8be4-ae607d8327e9', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 18:26:14.9844+00', ''),
	('00000000-0000-0000-0000-000000000000', '1110e8cf-e370-4c4b-b192-af223b757ea0', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 18:26:14.985492+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ea8c4be-fa50-4d8a-8ed2-8e5fc7f55038', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 19:07:41.915356+00', ''),
	('00000000-0000-0000-0000-000000000000', '5a4b1ee7-a2b3-4186-9d68-78bc847a5e52', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 19:07:41.91645+00', ''),
	('00000000-0000-0000-0000-000000000000', '96392942-6245-4abe-b798-6bc727c112c6', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 19:25:41.852068+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c54fdb74-edd4-4c69-8cdf-ea8ee5620d3f', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 19:25:41.853146+00', ''),
	('00000000-0000-0000-0000-000000000000', '27743ea1-9e5f-47de-9292-dc32d09d9b05', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 20:05:51.468944+00', ''),
	('00000000-0000-0000-0000-000000000000', '820e83b7-a5fd-489b-9454-86bca351016c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 20:05:51.469974+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1820b72-d23a-4764-a53f-150d3125d795', '{"action":"login","actor_id":"821cf797-33bb-4022-b172-ffd2794a0fdf","actor_name":"Andrew Hood","actor_username":"andrew@akhdigital.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-05 20:23:34.152702+00', ''),
	('00000000-0000-0000-0000-000000000000', '38c01c6a-52ff-4f9f-b13f-58f0f477a332', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 20:24:41.887303+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b94130ba-a0a9-43e6-9be0-8511a0379857', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 20:24:41.888419+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f235590-5267-43c1-8f1d-b92080d16578', '{"action":"logout","actor_id":"821cf797-33bb-4022-b172-ffd2794a0fdf","actor_name":"Andrew Hood","actor_username":"andrew@akhdigital.com","actor_via_sso":false,"log_type":"account"}', '2025-09-05 20:29:06.80605+00', ''),
	('00000000-0000-0000-0000-000000000000', '5295053e-2c72-463a-bda2-51d6b75fe8d3', '{"action":"login","actor_id":"821cf797-33bb-4022-b172-ffd2794a0fdf","actor_name":"Andrew Hood","actor_username":"andrew@akhdigital.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-05 20:29:59.948361+00', ''),
	('00000000-0000-0000-0000-000000000000', '42fe8074-6750-4f3e-a8b0-17cd6e5497ce', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 21:04:36.026089+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cededebe-f601-49ff-a22d-1bc8b8b30fb5', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 21:04:36.027628+00', ''),
	('00000000-0000-0000-0000-000000000000', '5daf4fba-2755-4c1c-98be-a0ed49699f80', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 21:23:42.09277+00', ''),
	('00000000-0000-0000-0000-000000000000', '041a4a50-f203-4fac-8e22-019bacacd3c7', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 21:23:42.093997+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f86b8bda-7102-40a8-8956-faf2a63682f6', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 22:02:55.489122+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f28bf171-7320-4aaf-ab62-6004c5957bcd', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 22:02:55.490156+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2a84d86-9603-46bf-bf09-fa4630cf4986', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 23:01:08.915288+00', ''),
	('00000000-0000-0000-0000-000000000000', '73bbd275-2876-440c-baec-360fdc27d37f', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 23:01:08.916424+00', ''),
	('00000000-0000-0000-0000-000000000000', '57375e35-ca6a-4d1e-81d3-9d431a1ad30c', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 00:00:14.76324+00', ''),
	('00000000-0000-0000-0000-000000000000', '09b73c1b-f759-4d40-9218-5dbb9c4f1cc9', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 00:00:14.764432+00', ''),
	('00000000-0000-0000-0000-000000000000', '96aa94c4-27fc-4b14-b843-a15a8571222e', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 00:58:20.310463+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fffa0c1c-390b-4b1d-99b3-0f99b459eb23', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 00:58:20.311999+00', ''),
	('00000000-0000-0000-0000-000000000000', '8a456bbb-a078-4337-ba6a-7a2cd2add268', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 01:56:33.465782+00', ''),
	('00000000-0000-0000-0000-000000000000', '683abce2-fa72-4923-af4e-72ecb788500c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 01:56:33.466829+00', ''),
	('00000000-0000-0000-0000-000000000000', '48646224-3c68-4f50-86ec-6a07a312c2f5', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 02:08:04.474812+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c25d4868-cc9e-44c1-a5f3-4ecd199256d7', '{"action":"logout","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account"}', '2025-09-06 02:08:04.936901+00', ''),
	('00000000-0000-0000-0000-000000000000', '8199089e-61ba-407d-b5e2-5fff87c66518', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 02:11:45.108637+00', ''),
	('00000000-0000-0000-0000-000000000000', '49de3181-09a9-4379-86bc-f5b4dd2dbd8a', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 03:10:08.452936+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf7f2a61-a85f-47c4-b8b4-72d9fa444fdf', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 03:10:08.454349+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa9a63d0-c957-4e0b-9791-cfe8c162af84', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 04:08:49.760774+00', ''),
	('00000000-0000-0000-0000-000000000000', '01c72a47-e076-483d-813c-7356361c59f6', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 04:08:49.762093+00', ''),
	('00000000-0000-0000-0000-000000000000', '42d413be-17bc-41be-b166-7874f8e948e3', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 05:07:28.865413+00', ''),
	('00000000-0000-0000-0000-000000000000', '92b86104-687b-46ff-8ef6-fc939d0ce58e', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 05:07:28.866984+00', ''),
	('00000000-0000-0000-0000-000000000000', '0b2c12a9-5dd8-4212-822c-c1b5cae1a76e', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 06:06:22.754047+00', ''),
	('00000000-0000-0000-0000-000000000000', '809c5292-fd1b-4533-aaaf-299fdde224e7', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 06:06:22.755369+00', ''),
	('00000000-0000-0000-0000-000000000000', '55afae02-20cf-4fb8-b4ef-d984f22e15bb', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 07:05:24.99534+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fe3e42d-3063-47a5-828b-f1d364da9fe8', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 07:05:25.00266+00', ''),
	('00000000-0000-0000-0000-000000000000', '71759f77-e2cf-4adf-aeaf-6b9dcdaf1d80', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 08:04:24.890224+00', ''),
	('00000000-0000-0000-0000-000000000000', '22f896b6-b36f-47a7-aab3-5205b3814933', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 08:04:24.891726+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c404364-21ed-4235-b337-829cef7bc474', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 09:03:24.923344+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd8db4793-55cc-4533-936b-3f9ae413a04c', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 09:03:24.924663+00', ''),
	('00000000-0000-0000-0000-000000000000', '7890285d-78f7-4c84-9af6-65f13b9e8783', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 10:01:56.831881+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abb0c873-73fd-4d60-ad03-91db12bc8adf', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 10:01:56.833422+00', ''),
	('00000000-0000-0000-0000-000000000000', '11244d51-9685-481b-885b-e785e16ff514', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 11:00:27.964458+00', ''),
	('00000000-0000-0000-0000-000000000000', '13e1be93-f5f5-45b1-abb3-576e0bd5f375', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 11:00:27.965589+00', ''),
	('00000000-0000-0000-0000-000000000000', '57ac1c98-bde0-4ddb-8ff4-8dc3fcf590f9', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 11:29:26.144777+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd863d448-81a5-4036-91f1-50cfed6209e8', '{"action":"logout","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account"}', '2025-09-06 11:29:26.530796+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da0f02e0-1842-4249-9f7c-23b1f1fa85ff', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 11:30:30.463308+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1f84ad6-6b4e-4911-b76e-7f3582b015ed', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 11:31:20.124192+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b277d13-05a6-44f0-bd0e-1e497d6505c7', '{"action":"logout","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account"}', '2025-09-06 11:31:20.37918+00', ''),
	('00000000-0000-0000-0000-000000000000', '8519d322-aeee-4a9c-b20d-58befa1fcf73', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 11:31:40.650831+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de68f828-ff7d-4373-a20e-f74812ec93cd', '{"action":"token_refreshed","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 12:29:53.855757+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc43ebdc-d6d1-4c67-95cd-ce1975649ee5', '{"action":"token_revoked","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"token"}', '2025-09-06 12:29:53.857353+00', ''),
	('00000000-0000-0000-0000-000000000000', '4eedf87b-9c7a-4821-a5f9-b7412e1834b3', '{"action":"login","actor_id":"241d165f-cf6c-4836-97ae-8fe1152583d9","actor_username":"admin@phoneguys.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-06 12:55:49.768501+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '821cf797-33bb-4022-b172-ffd2794a0fdf', 'authenticated', 'authenticated', 'andrew@akhdigital.com', '$2a$10$dwp3fKdWya.PL3kVpVCmaeA5W0XITsrWAYQTrpXP/RIRYqI/l7nS6', '2025-09-04 17:54:16.62176+00', '2025-09-04 17:52:01.684718+00', '', NULL, '', NULL, '', '', NULL, '2025-09-05 20:29:59.949159+00', '{"provider": "email", "providers": ["email"]}', '{"role": "admin", "full_name": "Andrew Hood", "email_verified": true, "invited_by_admin": true}', NULL, '2025-09-04 17:52:01.679028+00', '2025-09-05 20:29:59.951039+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', 'authenticated', 'authenticated', 'hello@aethercms.com', '$2a$10$1ULMVwliozPyyTKXvJlEKOuWCiVUAHHbmrIdZkTap4gBnrRa/vUJ2', '2025-09-04 04:11:16.959516+00', '2025-09-04 04:11:00.449568+00', '', NULL, '', NULL, '', '', NULL, '2025-09-04 04:11:16.963424+00', '{"provider": "email", "providers": ["email"]}', '{"role": "admin", "full_name": "Michael John", "email_verified": true, "invited_by_admin": true}', NULL, '2025-09-04 04:11:00.432769+00', '2025-09-04 04:11:25.195768+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '241d165f-cf6c-4836-97ae-8fe1152583d9', 'authenticated', 'authenticated', 'admin@phoneguys.com', '$2a$10$kd8MjfzGQ/tnK7u3p9I/Bu5WjfWQ3Eyy3K1vsMyepaJwZkJsmae6y', '2025-09-03 20:41:35.686387+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-06 12:55:49.769932+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-09-03 20:41:35.679124+00', '2025-09-06 12:55:49.772161+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('241d165f-cf6c-4836-97ae-8fe1152583d9', '241d165f-cf6c-4836-97ae-8fe1152583d9', '{"sub": "241d165f-cf6c-4836-97ae-8fe1152583d9", "email": "admin@phoneguys.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-03 20:41:35.682697+00', '2025-09-03 20:41:35.682728+00', '2025-09-03 20:41:35.682728+00', 'e5b8818a-d28f-49a3-8a7c-d5037a5a4fd3'),
	('9136a7c4-9535-4493-a5bf-c0c403f24ff0', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', '{"sub": "9136a7c4-9535-4493-a5bf-c0c403f24ff0", "email": "hello@aethercms.com", "email_verified": true, "phone_verified": false}', 'email', '2025-09-04 04:11:00.446789+00', '2025-09-04 04:11:00.446896+00', '2025-09-04 04:11:00.446896+00', '3d149507-bf24-47b9-8872-890fcc60da14'),
	('821cf797-33bb-4022-b172-ffd2794a0fdf', '821cf797-33bb-4022-b172-ffd2794a0fdf', '{"sub": "821cf797-33bb-4022-b172-ffd2794a0fdf", "email": "andrew@akhdigital.com", "email_verified": true, "phone_verified": false}', 'email', '2025-09-04 17:52:01.683047+00', '2025-09-04 17:52:01.683097+00', '2025-09-04 17:52:01.683097+00', 'e45dc4ca-5691-420c-959b-51b593ed8b95');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('0de1ee49-30e5-4019-9f22-eb34fb04321d', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', '2025-09-04 04:11:16.963493+00', '2025-09-04 04:11:16.963493+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '98.61.150.165', NULL),
	('fe0c88d5-5362-421b-bfbe-0ce4d8636f3d', '241d165f-cf6c-4836-97ae-8fe1152583d9', '2025-09-06 11:31:40.652016+00', '2025-09-06 12:29:53.861399+00', NULL, 'aal1', NULL, '2025-09-06 12:29:53.861313', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '98.61.150.165', NULL),
	('4364d44b-d480-4d14-851a-34718e5a56fa', '241d165f-cf6c-4836-97ae-8fe1152583d9', '2025-09-06 12:55:49.770014+00', '2025-09-06 12:55:49.770014+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '98.61.150.165', NULL),
	('9c1de054-12bf-4e41-8727-6938cf1aa43c', '821cf797-33bb-4022-b172-ffd2794a0fdf', '2025-09-05 20:29:59.949239+00', '2025-09-05 20:29:59.949239+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '70.238.227.57', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('0de1ee49-30e5-4019-9f22-eb34fb04321d', '2025-09-04 04:11:16.966279+00', '2025-09-04 04:11:16.966279+00', 'otp', '49aaac5f-4a05-4320-9a0c-c7f9e0f404ff'),
	('9c1de054-12bf-4e41-8727-6938cf1aa43c', '2025-09-05 20:29:59.951361+00', '2025-09-05 20:29:59.951361+00', 'password', '7d3a7e01-8195-42f2-99dc-1b0d27063224'),
	('fe0c88d5-5362-421b-bfbe-0ce4d8636f3d', '2025-09-06 11:31:40.654101+00', '2025-09-06 11:31:40.654101+00', 'password', '085473e0-9346-4113-ae10-d424bd605167'),
	('4364d44b-d480-4d14-851a-34718e5a56fa', '2025-09-06 12:55:49.772825+00', '2025-09-06 12:55:49.772825+00', 'password', '7fb2ca94-5c8d-46fe-bc66-c7161b125555');


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
	('00000000-0000-0000-0000-000000000000', 16, 'oyxppt2oglpi', '9136a7c4-9535-4493-a5bf-c0c403f24ff0', false, '2025-09-04 04:11:16.964444+00', '2025-09-04 04:11:16.964444+00', NULL, '0de1ee49-30e5-4019-9f22-eb34fb04321d'),
	('00000000-0000-0000-0000-000000000000', 75, 'i34khywdiisc', '241d165f-cf6c-4836-97ae-8fe1152583d9', true, '2025-09-06 11:31:40.652795+00', '2025-09-06 12:29:53.858025+00', NULL, 'fe0c88d5-5362-421b-bfbe-0ce4d8636f3d'),
	('00000000-0000-0000-0000-000000000000', 76, 'iifkrmsplein', '241d165f-cf6c-4836-97ae-8fe1152583d9', false, '2025-09-06 12:29:53.858785+00', '2025-09-06 12:29:53.858785+00', 'i34khywdiisc', 'fe0c88d5-5362-421b-bfbe-0ce4d8636f3d'),
	('00000000-0000-0000-0000-000000000000', 77, '6fpisvswg6gv', '241d165f-cf6c-4836-97ae-8fe1152583d9', false, '2025-09-06 12:55:49.771032+00', '2025-09-06 12:55:49.771032+00', NULL, '4364d44b-d480-4d14-851a-34718e5a56fa'),
	('00000000-0000-0000-0000-000000000000', 53, 'btaperse4vtn', '821cf797-33bb-4022-b172-ffd2794a0fdf', false, '2025-09-05 20:29:59.950116+00', '2025-09-05 20:29:59.950116+00', NULL, '9c1de054-12bf-4e41-8727-6938cf1aa43c');


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
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 77, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
