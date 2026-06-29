-- ============================================================================
-- Remove Humana contact "Chris Baker"
-- ----------------------------------------------------------------------------
-- Chris Baker is no longer a Humana broker contact. Delete the seeded row from
-- carrier_contacts so it stops showing in the Humana contact section.
-- Scoped tightly by name + email + Humana carrier so nothing else is touched.
-- ============================================================================

DELETE FROM carrier_contacts
WHERE name = 'Chris Baker'
  AND email = 'cbaker56@humana.com'
  AND carrier_id IN (SELECT id FROM carriers WHERE code = 'humana');
