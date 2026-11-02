-- DRAFT FOR ISOLATED SUPABASE HOMOLOGATION. NOT APPLIED OR VALIDATED ON POSTGRES.
-- Requires Supabase auth.users/auth.uid(), anon and authenticated roles.
-- Do not run on an existing/production project. No seed users or credentials.
BEGIN;
CREATE SCHEMA decola;
REVOKE ALL ON SCHEMA decola FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA decola TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA decola REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA decola REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

CREATE TABLE decola.accounts (
 id uuid PRIMARY KEY REFERENCES auth.users(id),
 disabled boolean NOT NULL DEFAULT false
);
CREATE TABLE decola.students (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES decola.accounts(id),
 eligibility_key text NOT NULL UNIQUE CHECK(length(eligibility_key) BETWEEN 32 AND 256)
);
CREATE TABLE decola.trial_claims (
 eligibility_key text NOT NULL,
 product text NOT NULL DEFAULT 'decola-monthly-v1' CHECK(product='decola-monthly-v1'),
 student_id uuid REFERENCES decola.students(id) ON DELETE SET NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 canceled_at timestamptz,
 CHECK(ends_at=starts_at+interval '168 hours'),
 CHECK(canceled_at IS NULL OR canceled_at>=starts_at),
 PRIMARY KEY(eligibility_key,product), UNIQUE(student_id,product)
);
CREATE TABLE decola.paid_periods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id uuid NOT NULL REFERENCES decola.students(id),
 provider text NOT NULL CHECK(provider='asaas'),
 environment text NOT NULL CHECK(environment='sandbox'),
 payment_id text NOT NULL UNIQUE,
 amount_cents integer NOT NULL CHECK(amount_cents=3990), currency text NOT NULL CHECK(currency='BRL'),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 revoked_at timestamptz
);
CREATE TABLE decola.payment_inbox (
 event_id text PRIMARY KEY, environment text NOT NULL CHECK(environment='sandbox'),
 payload_digest text NOT NULL, received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','reconciled','failed'))
);
CREATE TABLE decola.lesson_progress (
 student_id uuid NOT NULL REFERENCES decola.students(id), question_id text NOT NULL,
 content_version text NOT NULL, state jsonb NOT NULL CHECK(jsonb_typeof(state)='object'),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 source text NOT NULL CHECK(source IN ('local-import','server-attempt')),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(student_id,question_id,content_version)
);
CREATE TABLE decola.progress_imports (
 student_id uuid NOT NULL REFERENCES decola.students(id), request_id uuid NOT NULL,
 digest text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(student_id,request_id)
);
CREATE INDEX paid_periods_student_interval ON decola.paid_periods(student_id,ends_at);
CREATE INDEX students_account ON decola.students(account_id);
CREATE INDEX payment_inbox_pending ON decola.payment_inbox(state,received_at);

ALTER TABLE decola.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE decola.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE decola.trial_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE decola.paid_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE decola.payment_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE decola.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE decola.progress_imports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA decola FROM PUBLIC, anon, authenticated;
GRANT SELECT ON decola.accounts TO authenticated;
GRANT SELECT(id,account_id) ON decola.students TO authenticated;
GRANT SELECT ON decola.lesson_progress TO authenticated;
CREATE POLICY own_account ON decola.accounts FOR SELECT TO authenticated USING(id=(SELECT auth.uid()));
CREATE POLICY own_student ON decola.students FOR SELECT TO authenticated USING(account_id=(SELECT auth.uid()));
CREATE POLICY own_progress ON decola.lesson_progress FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM decola.students s WHERE s.id=student_id AND s.account_id=(SELECT auth.uid())));
-- No client INSERT/UPDATE/DELETE grants. Billing/inbox/claims/imports have no direct client access.
-- Provisioning accounts and eligibility keys is a future trusted backend operation.

CREATE FUNCTION decola.assert_student(p_student uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM decola.students s
  JOIN decola.accounts a ON a.id=s.account_id
  JOIN auth.users u ON u.id=a.id
  WHERE s.id=p_student AND a.id=auth.uid() AND NOT a.disabled
    AND u.email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Resource unavailable' USING ERRCODE='42501'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION decola.assert_student(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION decola.request_trial(p_student uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_key text; v_now timestamptz:=clock_timestamp(); v_record decola.trial_claims;
BEGIN
 PERFORM decola.assert_student(p_student);
 SELECT eligibility_key INTO v_key FROM decola.students WHERE id=p_student FOR UPDATE;
 INSERT INTO decola.trial_claims(eligibility_key,student_id,starts_at,ends_at)
 VALUES(v_key,p_student,v_now,v_now+interval '168 hours')
 ON CONFLICT(eligibility_key,product) DO NOTHING;
 SELECT * INTO v_record FROM decola.trial_claims WHERE eligibility_key=v_key AND product='decola-monthly-v1';
 RETURN jsonb_build_object('startsAt',v_record.starts_at,'endsAt',v_record.ends_at,'canceledAt',v_record.canceled_at);
END;
$$;
CREATE FUNCTION decola.cancel_trial(p_student uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM decola.assert_student(p_student);
 UPDATE decola.trial_claims SET canceled_at=coalesce(canceled_at,clock_timestamp()) WHERE student_id=p_student;
END;
$$;
CREATE FUNCTION decola.can_study(p_student uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_now timestamptz:=clock_timestamp();
BEGIN
 PERFORM decola.assert_student(p_student);
 RETURN EXISTS(SELECT 1 FROM decola.trial_claims t WHERE t.student_id=p_student AND t.canceled_at IS NULL AND t.starts_at<=v_now AND t.ends_at>v_now)
 OR EXISTS(SELECT 1 FROM decola.paid_periods p WHERE p.student_id=p_student AND p.revoked_at IS NULL AND p.starts_at<=v_now AND p.ends_at>v_now);
END;
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA decola FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION decola.request_trial(uuid),decola.cancel_trial(uuid),decola.can_study(uuid) TO authenticated;
-- assert_student remains private to SECURITY DEFINER functions.
-- No paid-period writer until canonical sandbox reconciliation is implemented/tested.
COMMIT;
