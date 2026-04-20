CREATE POLICY "Admins can update temples"
ON temples
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Festivals viewable if temple approved"
ON temple_festivals
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM temples
    WHERE id = temple_id AND status = 'approved'
  )
);

CREATE POLICY "Authenticated users can insert festivals"
ON temple_festivals
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tags viewable if temple approved"
ON temple_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM temples
    WHERE id = temple_id AND status = 'approved'
  )
);

CREATE POLICY "Authenticated users can insert tags"
ON temple_tags
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');