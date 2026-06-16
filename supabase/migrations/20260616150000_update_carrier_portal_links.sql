-- ============================================================================
-- Update carrier broker/agent portal links (UHC -> Jarvis, Wellcare -> Broker Resources)
-- ============================================================================

-- UnitedHealthcare: agent portal is now Jarvis
UPDATE carrier_links
SET name = 'Jarvis',
    url = 'https://www.uhcjarvis.com/content/jarvis/en/sign_in.html#/sign_in'
WHERE link_type = 'portal'
  AND carrier_id = (SELECT id FROM carriers WHERE code = 'uhc');

-- Wellcare: broker portal points to Broker Resources
UPDATE carrier_links
SET url = 'https://www.wellcare.com/Broker-Resources/Broker-Resources'
WHERE link_type = 'portal'
  AND carrier_id = (SELECT id FROM carriers WHERE code = 'wellcare');
