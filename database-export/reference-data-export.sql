-- =============================================
-- REFERENCE DATA EXPORT
-- Generated: 2024-12-24
-- =============================================

-- =============================================
-- CARRIERS TABLE (68 records)
-- =============================================

INSERT INTO carriers (id, code, name, display_name, product_tags, requires_corporate_resolution, requires_non_resident_states, notes, is_active, state_availability, created_at, updated_at) VALUES
('a25aaf59-5fda-42d4-bcda-3c1e83555930', 'aetna', 'Aetna', 'Aetna', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('360de801-f6f2-438c-b81e-404bddbf16e3', 'aetna_ma', 'Aetna MA', 'Aetna MA', '{}', false, true, 'Medicare Advantage - NV specific', true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('e01811dc-4d19-4d08-804b-39d16c6017ba', 'AETNA_MA', 'Aetna Medicare Advantage / Coventry', NULL, '{medicare_advantage}', false, true, 'LINK carrier', true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('a0564485-c9b3-45fd-b0c5-e2eaddb5111f', 'AETNA_MS', 'Aetna Medicare Supplement (ACI/CLI)', NULL, '{medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('9a783e7f-d318-4f4c-94ee-197b3c42b7d4', 'aetna_ms', 'Aetna MS', 'Aetna MS', '{}', false, true, 'Medicare Supplement - NV specific', true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('40d756a1-de9d-4548-bc91-03d2e2a15f47', 'AGLA', 'AGLA Life with Living Benefits', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('a647344d-4148-451c-b6e2-5f4c20d24332', 'agla', 'AGLA Life with Living Benefits', 'AGLA', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('9a98b9ad-d013-4c21-a7d7-565ad91b315f', 'ALIGNMENT', 'Alignment Health', NULL, '{medicare_advantage}', false, true, 'LINK carrier', true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('e3cdf869-09bc-4b04-9e66-0472e56ab2d5', 'alignment', 'Alignment Health', 'Alignment Health', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('11645053-376e-42e0-ad92-fa245cc9663a', 'AMERICAN_EQUITY', 'American Equity', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('3226f856-4640-406b-8d1c-a9fe838ba8bf', 'american_equity', 'American Equity', 'American Equity', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('70d91bf1-6d8d-4a22-9923-3f8ee53bfcc2', 'american_general', 'American General Life', 'American General', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('2efa0571-2ea6-4bd4-a0ef-46ce3bbda204', 'AGL_ANNUITY', 'American General Life Brokerage Annuity', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('568033be-0946-4318-b9fb-7a9d7a73c49d', 'AMERICO', 'Americo', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('ef33d8da-5b16-4314-a82d-6aedb96ff88d', 'americo', 'Americo', 'Americo', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('c5b1ff9a-d217-4f2e-a9a6-f0d1e6a8f3c2', 'AMERICO_LEGACY', 'Americo Legacy', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('d018798b-d1cb-41c6-8cab-d9bcbc2f43b3', 'anthem', 'Anthem', 'Anthem', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c', 'ANTHEM', 'Anthem Blue Cross Blue Shield', NULL, '{medicare_advantage,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', 'ASSURITY', 'Assurity', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('0d2eda22-47bd-4eb7-a776-4e204a186e13', 'assurity', 'Assurity', 'Assurity', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a', 'ATHENE', 'Athene', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'BALTIMORE', 'Baltimore Life', NULL, '{life,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'BANKERS_FIDELITY', 'Bankers Fidelity', NULL, '{medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'BCBS_MI', 'Blue Cross Blue Shield Michigan', NULL, '{medicare_advantage}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('f9a0b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'BRIGHT', 'Bright Health', NULL, '{medicare_advantage,aca}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b', 'BRIGHTHOUSE', 'Brighthouse Financial', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('d7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a', 'CAPITOL_LIFE', 'Capitol Life', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('c6d7e8f9-a0b1-c2d3-4e5f-6a7b8c9d0e1f', 'CIGNA', 'Cigna', NULL, '{medicare_advantage,medicare_supplement,aca}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('4102ee0a-fffe-496f-94cd-d1b4e3756850', 'cigna', 'Cigna', 'Cigna', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('b5c6d7e8-f9a0-b1c2-3d4e-5f6a7b8c9d0e', 'CLOVER', 'Clover Health', NULL, '{medicare_advantage}', false, true, 'LINK carrier', true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('a4b5c6d7-e8f9-a0b1-c2d3-4e5f6a7b8c9d', 'COLUMBIAN', 'Columbian Life', NULL, '{medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('93a4b5c6-d7e8-f9a0-b1c2-3d4e5f6a7b8c', 'COMBINED', 'Combined Insurance', NULL, '{life,supplemental}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('8293a4b5-c6d7-e8f9-a0b1-c2d3-4e5f6a7b', 'DEVOTED', 'Devoted Health', NULL, '{medicare_advantage}', false, true, 'LINK carrier', true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('71829a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b', 'EMBLEM', 'EmblemHealth', NULL, '{medicare_advantage}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('60718293-a4b5-c6d7-e8f9-a0b1c2d3e4f5', 'EQUITABLE', 'Equitable', NULL, '{annuity,life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('5f607182-93a4-b5c6-d7e8-f9a0b1c2d3e4', 'EQUITRUST', 'EquiTrust', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('4e5f6071-8293-a4b5-c6d7-e8f9a0b1c2d3', 'FGL', 'F&G (Fidelity & Guaranty)', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('3d4e5f60-7182-93a4-b5c6-d7e8f9a0b1c2', 'FORESTERS', 'Foresters Financial', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('2c3d4e5f-6071-8293-a4b5-c6d7e8f9a0b1', 'GERBER', 'Gerber Life', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('1b2c3d4e-5f60-7182-93a4-b5c6d7e8f9a0', 'GLOBAL_ATLANTIC', 'Global Atlantic', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('0a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9', 'GREAT_WESTERN', 'Great Western', NULL, '{annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('f9a0b1c2-d3e4-f5a6-b7c8-d9e0f1a2b3c4', 'GTL', 'GTL (Guarantee Trust Life)', NULL, '{medicare_supplement,life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('68b38637-8e94-4bae-a70d-bca5ac4f48f2', 'humana', 'Humana', 'Humana', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3', 'HUMANA', 'Humana', NULL, '{medicare_advantage,medicare_supplement,pdp}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('d7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2', 'INDEPENDENCE', 'Independence Blue Cross', NULL, '{medicare_advantage}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1', 'JOHN_HANCOCK', 'John Hancock', NULL, '{life,ltc}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('b5c6d7e8-f9a0-b1c2-d3e4-f5a6b7c8d9e0', 'LIBERTY_BANKERS', 'Liberty Bankers Life', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('a4b5c6d7-e8f9-a0b1-c2d3-e4f5a6b7c8d9', 'LINCOLN', 'Lincoln Financial', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('93a4b5c6-d7e8-f9a0-b1c2-d3e4f5a6b7c8', 'LUMICO', 'Lumico Life', NULL, '{life,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('8293a4b5-c6d7-e8f9-a0b1-c2d3e4f5a6b7', 'MANHATTAN', 'Manhattan Life', NULL, '{medicare_supplement,life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('71829a4b-5c6d-7e8f-9a0b-c2d3e4f5a6b7', 'MEDICO', 'Medico Corp', NULL, '{medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('60718293-a4b5-c6d7-e8f9-b1c2d3e4f5a6', 'MOLINA', 'Molina Healthcare', NULL, '{medicare_advantage,aca}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('5f607182-93a4-b5c6-d7e8-a0b1c2d3e4f5', 'MUTUAL_OMAHA', 'Mutual of Omaha', NULL, '{medicare_supplement,life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('1e035c4a-a163-433e-adb5-fd670cd3df78', 'mutual_omaha', 'Mutual of Omaha', 'Mutual of Omaha', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('4e5f6071-8293-a4b5-c6d7-f9a0b1c2d3e4', 'NATIONWIDE', 'Nationwide', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('3d4e5f60-7182-93a4-b5c6-e8f9a0b1c2d3', 'NGL', 'National Guardian Life', NULL, '{life,supplemental}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('2c3d4e5f-6071-8293-a4b5-d7e8f9a0b1c2', 'NORTH_AMERICAN', 'North American', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('1b2c3d4e-5f60-7182-93a4-c6d7e8f9a0b1', 'OSCAR', 'Oscar Health', NULL, '{aca,medicare_advantage}', false, true, 'LINK carrier', true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('0a1b2c3d-4e5f-6071-8293-b5c6d7e8f9a0', 'OXFORD', 'Oxford Life', NULL, '{annuity,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('f9a0b1c2-d3e4-f5a6-b7c8-a4b5c6d7e8f9', 'PACIFIC_LIFE', 'Pacific Life', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('e8f9a0b1-c2d3-e4f5-a6b7-93a4b5c6d7e8', 'PHILADELPHIA_AMERICAN', 'Philadelphia American Life', NULL, '{life,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('d7e8f9a0-b1c2-d3e4-f5a6-8293a4b5c6d7', 'PROTECTIVE', 'Protective Life', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('c6d7e8f9-a0b1-c2d3-e4f5-71829a4b5c6d', 'PRUDENTIAL', 'Prudential', NULL, '{life,annuity}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('b5c6d7e8-f9a0-b1c2-d3e4-60718293a4b5', 'ROYAL_NEIGHBORS', 'Royal Neighbors of America', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('a4b5c6d7-e8f9-a0b1-c2d3-5f60718293a4', 'SENTINEL', 'Sentinel Security Life', NULL, '{medicare_supplement,life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('2200c20a-3b5c-4aca-9e6a-a67e3232bed0', 'silversneakers', 'SilverSneakers', 'SilverSneakers', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('f6ecd893-d2a8-4f63-9ebf-8f507fe7f304', 'simply', 'Simply Healthcare', 'Simply Healthcare', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('93a4b5c6-d7e8-f9a0-b1c2-4e5f60718293', 'SIMPLY', 'Simply Healthcare', NULL, '{medicare_advantage}', false, true, 'LINK carrier', true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('8ee0fd4c-cd24-4905-97d0-b3956302b0ee', 'transamerica', 'Transamerica', 'Transamerica', '{}', false, true, NULL, true, NULL, '2025-12-20 00:34:29.692153+00', '2025-12-20 00:34:29.692153+00'),
('8293a4b5-c6d7-e8f9-a0b1-3d4e5f607182', 'TRANSAMERICA', 'Transamerica', NULL, '{life,annuity,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('71829a4b-5c6d-7e8f-9a0b-2c3d4e5f6071', 'TRINITY', 'Trinity Life', NULL, '{life}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('60718293-a4b5-c6d7-e8f9-1b2c3d4e5f60', 'UNITED_HOME', 'United Home Life', NULL, '{life,medicare_supplement}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('5f607182-93a4-b5c6-d7e8-0a1b2c3d4e5f', 'UHC', 'UnitedHealthcare', NULL, '{medicare_advantage,medicare_supplement,pdp}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00'),
('4e5f6071-8293-a4b5-c6d7-f9a0b1c2d3e5', 'WELLCARE', 'Wellcare', NULL, '{medicare_advantage,pdp}', false, true, NULL, true, NULL, '2025-12-11 01:25:08.789012+00', '2025-12-11 01:25:08.789012+00');

-- =============================================
-- STATE_CARRIERS TABLE (17 records)
-- Maps carriers to states with availability
-- =============================================

INSERT INTO state_carriers (id, carrier_id, state_code, is_available, is_default, created_at, updated_at) VALUES
-- Kentucky carriers
('05e6b4c2-4d6b-490b-aa47-620e510c2e17', 'a25aaf59-5fda-42d4-bcda-3c1e83555930', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('31e88fa9-9ff4-4715-ac17-05fff1855157', '1e035c4a-a163-433e-adb5-fd670cd3df78', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('b3bd7b14-6b98-4cb5-9b6e-8c5de76f9601', '4102ee0a-fffe-496f-94cd-d1b4e3756850', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('ace9da44-6a6d-4c14-bce9-c21020e7039d', '68b38637-8e94-4bae-a70d-bca5ac4f48f2', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('7e57f66d-2a83-4fb8-aa83-ab352040dd3e', '0d2eda22-47bd-4eb7-a776-4e204a186e13', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('c1d9c75f-0900-4f70-a8ec-416396a1dfd7', 'd018798b-d1cb-41c6-8cab-d9bcbc2f43b3', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('817d2376-f0c1-47e1-a35b-b97d9a153c33', 'f6ecd893-d2a8-4f63-9ebf-8f507fe7f304', 'KY', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
-- Nevada carriers
('2528b69b-9620-443a-a77a-f6b28bb6bb1a', '0d2eda22-47bd-4eb7-a776-4e204a186e13', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('dc9a5944-fa4b-4ebc-9b75-010738ba2eba', '2200c20a-3b5c-4aca-9e6a-a67e3232bed0', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('f9a791c9-9591-4bcb-b418-a2650ade8000', '360de801-f6f2-438c-b81e-404bddbf16e3', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('9cba1e10-b11b-4bef-a54d-1c3442909748', '4102ee0a-fffe-496f-94cd-d1b4e3756850', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('10ca222e-6a62-45b3-8789-360fca2af20f', '68b38637-8e94-4bae-a70d-bca5ac4f48f2', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('e7faefc0-6957-4b5e-bb76-d19642487b2d', '8ee0fd4c-cd24-4905-97d0-b3956302b0ee', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('59d601a4-36e2-4551-bcb4-f369548bfb0d', '9a783e7f-d318-4f4c-94ee-197b3c42b7d4', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('3b7561c0-8658-4ddb-9d2e-4da76fee6f46', 'd018798b-d1cb-41c6-8cab-d9bcbc2f43b3', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00'),
('d0e085b6-e90d-43c4-b6b5-0526e64ec533', 'e3cdf869-09bc-4b04-9e66-0472e56ab2d5', 'NV', true, true, '2025-12-20 00:38:50.981889+00', '2025-12-20 00:38:50.981889+00');

-- =============================================
-- FEATURE_FLAGS TABLE (6 records)
-- =============================================

INSERT INTO feature_flags (id, flag_key, flag_value, description, created_at, updated_at) VALUES
('c612575a-11a2-45a4-b92c-849e7d074ab5', 'agent_chat', true, 'Enable agent chat widget', '2025-12-18 21:47:55.910481+00', '2025-12-18 21:47:55.910481+00'),
('4f626e58-97f7-435b-972b-bc8234dbd85a', 'dark_mode', true, 'Enable dark mode toggle', '2025-12-18 21:47:55.910481+00', '2025-12-18 22:43:10.733+00'),
('16e13529-4627-473f-a095-c8f907e51eca', 'maintenance_mode', false, 'Put platform in maintenance mode', '2025-12-18 21:47:55.910481+00', '2025-12-18 22:39:01.561+00'),
('cc50a8b4-af8b-4b2e-bb2d-bee7a10969cf', 'new_agent_form', false, 'Enable new agent onboarding form redesign', '2025-12-18 21:47:55.910481+00', '2025-12-18 22:39:05.124+00'),
('d4fd278c-ff36-4b6c-b562-1e57e43c95f8', 'pdf_v2', false, 'Enable PDF generation v2', '2025-12-18 21:47:55.910481+00', '2025-12-19 02:13:04.341+00'),
('a9dac2f9-6733-4e57-908c-1e3975960df6', 'test_mode', true, 'When enabled, all new submissions are marked as test data', '2025-12-19 01:03:04.858787+00', '2025-12-19 02:18:18.51+00');

-- =============================================
-- HIERARCHY_ENTITIES TABLE (1 record)
-- =============================================

INSERT INTO hierarchy_entities (id, name, entity_type, parent_entity_id, is_active, created_at, updated_at) VALUES
('c8235dc6-9c41-4055-b995-80fbd9a2db4b', 'A&A', 'team', NULL, true, '2025-12-20 00:45:57.429285+00', '2025-12-20 00:45:57.429285+00');

-- =============================================
-- CERTIFICATION_WINDOWS TABLE (0 records)
-- No data currently populated
-- =============================================

-- =============================================
-- SYSTEM_CONFIG TABLE (has data but contains complex JSON)
-- Exported separately if needed
-- =============================================
