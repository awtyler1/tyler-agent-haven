-- Migration: Seed carrier directory data (contacts, links, documents)
-- This converts the seed_kentucky_carrier_data.sql into a migration so it
-- auto-applies to production. Only inserts if tables are empty.

DO $$
BEGIN
  -- Only seed if carrier_contacts is empty (avoid duplicating data)
  IF (SELECT COUNT(*) FROM carrier_contacts) > 0 THEN
    RAISE NOTICE 'carrier_contacts already has data, skipping seed';
    RETURN;
  END IF;

  -- ========================================================================
  -- AETNA
  -- ========================================================================
  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Jonathan Lemaster', 'Broker Manager', '(859) 333-5389', 'lemasterj1@aetna.com', 'Greater Lexington / Ashland / Eastern Kentucky', false
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Will Coursey', 'Broker Manager', '(270) 816-9531', 'courseyw@aetna.com', 'Greater Bowling Green, Owensboro, Western KY', false
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Nina Grinestaff', 'Broker Manager', '(502) 443-5381', 'grinestaff@aetna.com', 'Greater Louisville, Northern KY', false
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, is_primary)
  SELECT c.id, 'KY', 'broker_support', 'Broker Services', NULL, '(866) 714-9301', 'brokersupport@aetna.com', true
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'Broker Portal', 'https://www.aetna.com/producer_public/login.fcc', NULL, 1
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'marketing', 'Kit Ordering Portal', 'https://aetna-pek-ff-op.memberdoc.com/#/login', 'Username and password are your NPN', 2
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, 'KY', 'resource', 'Kentucky Broker Managers', '/downloads/Aetna_KY_Medicare_Broker_Managers.pdf', NULL, 3
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, 'KY', 'training', 'Aetna Medicare 2026 KY Market Specific Training', '/downloads/Aetna_Medicare_2026_KY_Market_Specific_Training.pdf', 2026, 1
  FROM carriers c WHERE c.code = 'aetna';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', 'Aetna Medicare Extra Benefits Card 2026 Broker Playbook', '/downloads/2026_Aetna_Medicare_EBC_Broker_Playbook.pdf', 2026, 2
  FROM carriers c WHERE c.code = 'aetna';

  -- ========================================================================
  -- ANTHEM
  -- ========================================================================
  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Sam Call', 'Broker Manager', '(502) 216-3480', 'sam.call@anthem.com', 'Western KY', false
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Jordan Gentry', 'Broker Manager', '(859) 585-8183', 'jordan.gentry@anthem.com', 'Eastern KY', false
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, is_primary)
  SELECT c.id, 'KY', 'sales_manager', 'Todd Jarboe', 'Agency Services Rep', '(502) 396-0695', 'todd.jarboe@anthem.com', false
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, is_primary)
  SELECT c.id, 'KY', 'broker_support', 'Broker Services', NULL, '(800) 633-4368', 'medicareagentsupport@anthem.com', true
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'Producer World', 'https://brokerportal.anthem.com/apps/ptb/login', NULL, 1
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'mProducer', 'https://mproducer.anthem.com/mproducer/public/login', NULL, 2
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'marketing', 'Order Materials', 'https://custompoint.rrd.com/xs2/prelogin?qwerty=25113007', NULL, 3
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'certification', 'Certification', 'https://getcertified.elevancehealth.com/medicare/certify?brand=ELV', NULL, 4
  FROM carriers c WHERE c.code = 'anthem';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'compliance', 'Non-Commissionable Plans', '/downloads/Anthem_Non-Commissionable-MA-Plans_ABCBS.pdf', 2026, 1
  FROM carriers c WHERE c.code = 'anthem';

  -- ========================================================================
  -- DEVOTED
  -- ========================================================================
  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'sales_manager', 'Jotham Cortez', 'Sales Director', '(573) 356-4005', 'jotham.cortez@devoted.com', 'MO, AR, KY, KS', false
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Cole Lawson', 'Broker Manager', '(618) 946-1111', 'cole.lawson@devoted.com', 'Kentucky', false
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Hailey Lindenbauer', 'Broker Manager', '(502) 794-1717', 'hailey.lindenbauer@devoted.com', 'KY (Eastern, Lexington, Southeastern)', false
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, is_primary)
  SELECT c.id, 'KY', 'broker_support', 'Agent Support Team', NULL, '1-877-764-9446', true
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'Agent Portal', 'https://agent.devoted.com/', NULL, 1
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'drug_search', 'Search Drugs', 'https://www.devoted.com/search-formulary/', NULL, 2
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'provider_search', 'Search Providers', 'https://www.devoted.com/search-providers/', NULL, 3
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', 'Broker Manual', '/downloads/Devoted_Health_Broker_Manual.pdf', NULL, 1
  FROM carriers c WHERE c.code = 'devoted';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'compliance', 'Formulary', '/downloads/Devoted_Drug_List_2026.pdf', 2026, 2
  FROM carriers c WHERE c.code = 'devoted';

  -- ========================================================================
  -- HUMANA
  -- ========================================================================
  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, is_primary)
  SELECT c.id, 'KY', 'sales_manager', 'Horace Williams', 'Broker Relationship Executive', '(502) 313-7938', 'hwilliams41@humana.com', false
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Chris Baker', 'Broker Relationship Manager', '(859) 227-9256', 'cbaker56@humana.com', 'Eastern Kentucky', false
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Samantha Stevenson', 'Broker Relationship Manager', '(502) 438-3816', 'sjones224@humana.com', 'Western Kentucky', false
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, is_primary)
  SELECT c.id, 'KY', 'broker_support', 'Humana Agent Support Unit', NULL, '(800) 309-3163', 'AgentSupport@Humana.com', true
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'Vantage', 'https://account.humana.com/', NULL, 1
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'drug_search', 'Medicare Drug List Search', 'https://rxcalculator.humana.com/medicaredrugsearch', NULL, 2
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'provider_search', 'Find a Provider', 'https://findcare.humana.com/', NULL, 3
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, 'KY', 'market_highlights', 'KY Humana Market Product Guide 2026', '/downloads/KY_Humana_Market_Product_Guide_2026.pdf', 2026, 1
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'form', 'Blank Verification of Chronic Condition (VCC) Form', '/downloads/Blank_Verification_of_Chronic_Condition_VCC.pdf', NULL, 2
  FROM carriers c WHERE c.code = 'humana';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', '2026 OTC Catalog and Order Form', '/downloads/Humana_2026_OTC_Catalog_Order_Form.pdf', 2026, 3
  FROM carriers c WHERE c.code = 'humana';

  -- ========================================================================
  -- UHC
  -- ========================================================================
  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, is_primary)
  SELECT c.id, 'KY', 'sales_manager', 'Mark Reeder', 'Market Growth Manager', '(270) 566-1071', 'Mark_Reeder@uhc.com', false
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, is_primary)
  SELECT c.id, 'KY', 'broker_support', 'Producer Help Desk', NULL, '(888) 381-8581', true
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'Agent Portal', 'https://www.uhcagent.com', NULL, 1
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'resource', 'Plan Finder', 'https://www.uhcmedicaresolutions.com/', NULL, 2
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'provider_search', 'Find a Provider', 'https://connect.werally.com/uhc/home', NULL, 3
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', '2026 UCard Quick Reference Guide', '/downloads/UHC_2026_UCard_Quick_Reference_Guide.pdf', 2026, 1
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', '2026 Fitness Quick Reference Guide', '/downloads/UHC_2026_Fitness_Quick_Reference_Guide.pdf', 2026, 2
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', '2026 OTC + Healthy Food + Utilities Quick Reference Guide', '/downloads/UHC_2026_OTC_Healthy_Food_Utilities_Quick_Reference_Guide.pdf', 2026, 3
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', '2026 Dental Quick Reference Guide', '/downloads/UHC_2026_Dental_Quick_Reference_Guide.pdf', 2026, 4
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', '2026 SSBCI Quick Reference Guide', '/downloads/UHC_2026_SSBCI_Quick_Reference_Guide.pdf', 2026, 5
  FROM carriers c WHERE c.code = 'uhc';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'compliance', '2026 Part D Formulary Changes', '/downloads/UHC_2026_Part_D_Formulary_Changes.pdf', 2026, 6
  FROM carriers c WHERE c.code = 'uhc';

  -- ========================================================================
  -- WELLCARE
  -- ========================================================================
  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'territory_manager', 'Austin Compton', 'Regional Agency Manager', '(859) 297-8759', 'Austin.Compton@wellcare.com', 'Kentucky', false
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, phone, email, region, is_primary)
  SELECT c.id, 'KY', 'sales_manager', 'Melanie Barton', 'Sales Manager', '(615) 653-8234', 'Melanie.Barton@wellcare.com', 'KY, IN & TN', false
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_contacts (carrier_id, state_code, contact_type, name, title, email, region, is_primary)
  SELECT c.id, 'KY', 'sales_manager', 'Kimberly Scott', 'Regional Sales Director', 'Kimberly.J.Scott@wellcare.com', 'Central Region', false
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'portal', 'Broker Portal', 'https://brokerportal.wellcare.com/login', NULL, 1
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'provider_search', 'Provider Search', 'https://www.wellcare.com/en/Medicare/Find-A-Doctor', NULL, 2
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_links (carrier_id, state_code, link_type, name, url, description, display_order)
  SELECT c.id, NULL, 'drug_search', 'Drug Search', 'https://www.wellcare.com/en/Medicare/Prescription-Drug-Coverage', NULL, 3
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, 'KY', 'market_highlights', '2026 KY Market Highlights', '/downloads/Wellcare_2026_KY_Market_Highlights.pdf', 2026, 1
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'guide', 'Commitment to Broker Service Excellence 2026', '/downloads/Wellcare_Commitment_to_Broker_Service_Excellence_2026.pdf', 2026, 2
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'training', 'Medicare Advantage Sales Presentation 2026', '/downloads/Wellcare_Medicare_Advantage_Sales_Presentation_2026.pdf', 2026, 3
  FROM carriers c WHERE c.code = 'wellcare';

  INSERT INTO carrier_documents (carrier_id, state_code, document_type, name, file_path, year, display_order)
  SELECT c.id, NULL, 'compliance', 'Formulary', '/downloads/Wellcare_Formulary_2026.pdf', 2026, 4
  FROM carriers c WHERE c.code = 'wellcare';

END $$;
