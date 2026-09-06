CREATE OR REPLACE FUNCTION forbid_original_transcript_update()
RETURNS trigger AS $$
BEGIN
  IF NEW."originalText" IS DISTINCT FROM OLD."originalText" THEN
    RAISE EXCEPTION 'originalText is immutable (gold-standard invariant)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcript_original_immutable
  BEFORE UPDATE ON "Transcript"
  FOR EACH ROW EXECUTE FUNCTION forbid_original_transcript_update();
