import concurrent.futures
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from local_model import LocalModel, Principal, Denied, Conflict, parse_snapshot

HERE = Path(__file__).parent
NOW = 1793620800


def snapshot(answers=None):
    return json.dumps({'schemaVersion': 1, 'sourceKey': 'decola-smart-percent-v3', 'contentVersion': 'percentage-v3', 'answers': answers if answers is not None else {'0': {'choice': 0, 'attempts': 1, 'done': False}}})


def database(path=':memory:'):
    db = sqlite3.connect(path)
    db.executescript((HERE / 'schema.sql').read_text())
    db.executemany('INSERT INTO accounts VALUES (?,?,?)', [('a', 1, 0), ('b', 1, 0), ('unverified', 0, 0), ('disabled', 1, 1)])
    db.executemany('INSERT INTO students VALUES (?,?,?)', [('sa', 'a', 'verified-identity-a'), ('sb', 'b', 'verified-identity-b')])
    db.commit()
    return db


class LocalSecurityTests(unittest.TestCase):
    def setUp(self):
        self.db = database()
        self.model = LocalModel(self.db)
        self.a = Principal('a', NOW + 900000)
        self.b = Principal('b', NOW + 900000)

    def tearDown(self):
        self.db.close()

    def test_no_trial_on_visit(self):
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW))
        self.assertEqual(self.db.execute('SELECT count(*) FROM trials').fetchone()[0], 0)

    def test_expiration_exactly_seven_days(self):
        grant = self.model.start_trial(self.a, 'sa', NOW)
        self.assertEqual(grant['ends_at'], NOW + 604800)
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW - 1))
        self.assertTrue(self.model.can_study(self.a, 'sa', NOW))
        self.assertTrue(self.model.can_study(self.a, 'sa', NOW + 604799))
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW + 604800))
        self.assertEqual(self.db.execute('SELECT count(*) FROM subscriptions').fetchone()[0], 0)

    def test_repeated_and_expired_trials_not_extended(self):
        first = self.model.start_trial(self.a, 'sa', NOW)
        for offset in (1, 604800, 700000):
            self.assertEqual(first, self.model.start_trial(self.a, 'sa', NOW + offset))

    def test_cancel_immediately_and_no_restart(self):
        self.model.start_trial(self.a, 'sa', NOW)
        self.model.cancel_trial(self.a, 'sa', NOW + 1)
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW + 1))
        self.assertEqual(self.model.start_trial(self.a, 'sa', NOW + 2)['canceled_at'], NOW + 1)

    def test_anonymous_expired_unverified_disabled_denied(self):
        for principal in (None, {'account_id': 'a'}, Principal('a', NOW), Principal('unverified', NOW + 1), Principal('disabled', NOW + 1), Principal('missing', NOW + 1)):
            with self.subTest(principal=principal), self.assertRaises(Denied):
                self.model.can_study(principal, 'sa', NOW)

    def test_cross_account_access_and_import_denied(self):
        for fn in (lambda: self.model.start_trial(self.b, 'sa', NOW), lambda: self.model.can_study(self.b, 'sa', NOW), lambda: self.model.import_progress(self.b, 'sa', 'r', snapshot(), NOW), lambda: self.model.cancel_trial(self.b, 'sa', NOW)):
            with self.assertRaises(Denied):
                fn()
        self.assertEqual(self.db.execute('SELECT count(*) FROM trials').fetchone()[0], 0)

    def test_invalid_server_clock_rejected(self):
        for now in (-1, True, 1.5, 253402300800):
            with self.assertRaises(ValueError):
                self.model.can_study(self.a, 'sa', now)

    def test_identity_claim_survives_student_recreation(self):
        self.model.start_trial(self.a, 'sa', NOW)
        with self.db:
            self.db.execute("DELETE FROM students WHERE id='sa'")
            self.db.execute("INSERT INTO students VALUES ('new','a','verified-identity-a')")
        old = self.model.start_trial(self.a, 'new', NOW + 1)
        self.assertEqual(old['starts_at'], NOW)
        self.assertFalse(self.model.can_study(self.a, 'new', NOW + 1))

    def test_paid_fixture_requires_valid_period_and_not_revoked(self):
        # Synthetic DB fixture ONLY; no adapter or payment is implemented.
        with self.db:
            self.db.execute("INSERT INTO subscriptions VALUES ('p','sa','fixture-only','cancel_at_period_end',3990,'BRL',?,?)", (NOW, NOW + 100))
        self.assertTrue(self.model.can_study(self.a, 'sa', NOW))
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW + 100))
        with self.db:
            self.db.execute("UPDATE subscriptions SET status='revoked'")
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW))

    def test_db_rejects_wrong_price_currency_and_trial_duration(self):
        for amount, currency in ((1, 'BRL'), (3990, 'USD')):
            with self.assertRaises(sqlite3.IntegrityError), self.db:
                self.db.execute("INSERT INTO subscriptions VALUES ('p','sa','fixture','active',?,?,?,?)", (amount, currency, NOW, NOW + 1))
        with self.assertRaises(sqlite3.IntegrityError), self.db:
            self.db.execute("INSERT INTO trials VALUES ('verified-identity-a','decola-monthly-v1','sa',?,?,NULL)", (NOW, NOW + 1))

    def test_import_valid_preserves_attempt_and_retry(self):
        result = self.model.import_progress(self.a, 'sa', 'r', snapshot(), NOW)
        self.assertEqual(result['inserted'], ['porcentagem-q1'])
        record = self.db.execute('SELECT * FROM lesson_progress').fetchone()
        self.assertEqual((record['choice'], record['attempts'], record['done']), (0, 1, 0))
        self.assertFalse(self.model.can_study(self.a, 'sa', NOW))

    def test_import_idempotent_and_never_overwrites(self):
        first = self.model.import_progress(self.a, 'sa', 'r', snapshot(), NOW)
        self.assertEqual(first, self.model.import_progress(self.a, 'sa', 'r', snapshot(), NOW))
        changed = snapshot({'0': {'choice': 1, 'attempts': 2, 'done': True}})
        with self.assertRaises(Conflict):
            self.model.import_progress(self.a, 'sa', 'r', changed, NOW)
        self.assertEqual(self.model.import_progress(self.a, 'sa', 'r2', changed, NOW)['keptExisting'], ['porcentagem-q1'])
        self.assertEqual(self.db.execute('SELECT attempts FROM lesson_progress').fetchone()[0], 1)

    def test_import_rejects_privileged_duplicate_unknown_and_oversized_data(self):
        value = json.loads(snapshot())
        for field, data in (('isPaid', True), ('account_id', 'b'), ('__proto__', {})):
            with self.subTest(field=field), self.assertRaises(ValueError):
                parse_snapshot(json.dumps({**value, field: data}))
        for raw in ('{"schemaVersion":1,"schemaVersion":1}', snapshot().replace('percentage-v3', 'unknown'), ' ' * 10001, '[]'):
            with self.assertRaises(ValueError):
                parse_snapshot(raw)

    def test_import_rejects_forged_completion_and_bool_as_integer(self):
        for state in ({'choice': 0, 'attempts': 1, 'done': True}, {'choice': True, 'attempts': 1, 'done': True}, {'choice': 1, 'attempts': True, 'done': True}, {'choice': 7, 'attempts': 2, 'done': True}, {'choice': None, 'attempts': 2, 'done': True}):
            with self.assertRaises(ValueError):
                parse_snapshot(snapshot({'0': state}))

    def test_sql_injection_is_literal_and_not_authorization(self):
        with self.assertRaises(Denied):
            self.model.can_study(self.a, "sa' OR 1=1 --", NOW)
        self.assertEqual(self.db.execute('SELECT count(*) FROM accounts').fetchone()[0], 4)

    def test_import_atomic_rollback_on_database_failure(self):
        self.db.execute("CREATE TRIGGER fail_import BEFORE INSERT ON lesson_progress WHEN NEW.question_id='porcentagem-q2' BEGIN SELECT RAISE(ABORT,'fixture failure'); END")
        raw = snapshot({'0': {'choice': 0, 'attempts': 1, 'done': False}, '1': {'choice': 0, 'attempts': 1, 'done': True}})
        with self.assertRaises(sqlite3.IntegrityError):
            self.model.import_progress(self.a, 'sa', 'r', raw, NOW)
        self.assertEqual(self.db.execute('SELECT count(*) FROM lesson_progress').fetchone()[0], 0)
        self.assertEqual(self.db.execute('SELECT count(*) FROM imports').fetchone()[0], 0)

    def test_support_deduplicates_and_routes_complaint_to_human(self):
        ticket = self.model.support(self.a, 'web', 'e1', 'complaint', 'Exemplo fictício', NOW)
        self.assertEqual(ticket, self.model.support(self.a, 'web', 'e1', 'complaint', 'Exemplo fictício', NOW + 1))
        self.assertEqual(self.db.execute('SELECT status FROM support_tickets').fetchone()[0], 'awaiting_staff')
        with self.assertRaises(Conflict):
            self.model.support(self.b, 'web', 'e1', 'complaint', 'Exemplo fictício', NOW)
        with self.assertRaises(Conflict):
            self.model.support(self.a, 'web', 'e1', 'complaint', 'Outro texto', NOW)
        self.assertEqual(self.db.execute('SELECT count(*) FROM support_tickets').fetchone()[0], 1)

    def test_support_db_failure_returns_no_protocol(self):
        self.db.execute("CREATE TRIGGER fail_support BEFORE INSERT ON support_tickets BEGIN SELECT RAISE(ABORT,'fixture failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            self.model.support(self.a, 'whatsapp', 'e', 'suggestion', 'Fictício', NOW)
        self.assertEqual(self.db.execute('SELECT count(*) FROM support_tickets').fetchone()[0], 0)

    def test_support_payload_rejected(self):
        for message in ('', ' ', 'x' * 1201, {'admin': True}):
            with self.assertRaises(ValueError):
                self.model.support(self.a, 'web', 'e', 'question', message, NOW)
        with self.assertRaises(Denied):
            self.model.support(None, 'web', 'e', 'question', 'Fictício', NOW)

    def test_parallel_trial_requests_share_one_claim(self):
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / 'local.sqlite')
            database(path).close()
            gate = threading.Barrier(2)
            def request(_):
                db = sqlite3.connect(path, timeout=5)
                try:
                    model = LocalModel(db)
                    gate.wait(timeout=5)
                    return model.start_trial(self.a, 'sa', NOW)
                finally:
                    db.close()
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                results = list(executor.map(request, range(2)))
            self.assertEqual(results[0], results[1])
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute('SELECT count(*) FROM trials').fetchone()[0], 1)


if __name__ == '__main__':
    unittest.main()
