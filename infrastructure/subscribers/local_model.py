"""Executable LOCAL design reference. Not an HTTP server, Auth, billing or SDK.
Principal and `now` MUST come from a future verified server adapter, never JSON.
No network, environment secrets, browser storage or real data are read here.
"""
import hashlib
import json
from pathlib import Path
import sqlite3
import uuid
from dataclasses import dataclass

PRODUCT = 'decola-monthly-v1'
CATALOG = json.loads(Path(__file__).with_name('percentage-catalog.json').read_text())


class Denied(ValueError):
    pass


class Conflict(ValueError):
    pass


@dataclass(frozen=True)
class Principal:
    account_id: str
    expires_at: int


def instant(value):
    if type(value) is not int or not 0 <= value <= 253402300799:
        raise ValueError('Invalid server UTC seconds')
    return value


def identifier(value):
    if not isinstance(value, str) or not 1 <= len(value) <= 128 or not value.isascii() or not all(c.isalnum() or c in '-_:.' for c in value):
        raise ValueError('Invalid identifier')
    return value


def strict_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate JSON key')
        result[key] = value
    return result


def parse_snapshot(raw):
    if not isinstance(raw, str) or len(raw.encode('utf-8')) > 10000:
        raise ValueError('Invalid snapshot size')
    data = json.loads(raw, object_pairs_hook=strict_object)
    expected = {'schemaVersion', 'sourceKey', 'contentVersion', 'answers'}
    if not isinstance(data, dict) or set(data) != expected or type(data['schemaVersion']) is not int or data['schemaVersion'] != 1:
        raise ValueError('Unknown envelope or privileged fields')
    if data['sourceKey'] != CATALOG['sourceKey'] or data['contentVersion'] != CATALOG['contentVersion']:
        raise ValueError('Unsupported content version; retain original locally')
    answers = data['answers']
    if not isinstance(answers, dict):
        raise ValueError('Invalid answers')
    normalized = []
    for key, state in answers.items():
        if key not in ('0', '1', '2') or not isinstance(state, dict) or set(state) != {'choice', 'attempts', 'done'}:
            raise ValueError('Invalid question or state')
        q = CATALOG['questions'][int(key)]
        choice, attempts, done = state['choice'], state['attempts'], state['done']
        if type(attempts) is not int or attempts not in (1, 2) or type(done) is not bool:
            raise ValueError('Invalid attempts or completion')
        if choice is None:
            if attempts != 1 or done:
                raise ValueError('Invalid retry state')
        elif type(choice) is not int or not 0 <= choice < q['options'] or done != (choice == q['answer'] or attempts == 2):
            raise ValueError('Inconsistent answer')
        normalized.append((q['id'], choice, attempts, int(done)))
    return sorted(normalized)


class LocalModel:
    def __init__(self, connection):
        self.db = connection
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA foreign_keys=ON')

    def account(self, principal, now):
        instant(now)
        if not isinstance(principal, Principal) or instant(principal.expires_at) <= now:
            raise Denied('Authentication required')
        account = self.db.execute('SELECT * FROM accounts WHERE id=?', (principal.account_id,)).fetchone()
        if not account or not account['verified'] or account['disabled']:
            raise Denied('Verified active account required')
        return account

    def student(self, principal, student_id, now):
        self.account(principal, now)
        row = self.db.execute('SELECT * FROM students WHERE id=? AND account_id=?', (student_id, principal.account_id)).fetchone()
        if not row:
            raise Denied('Resource unavailable')
        return row

    def start_trial(self, principal, student_id, now):
        instant(now + 604800)
        # Write lock + unique claim prevents two simultaneous trial grants.
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            student = self.student(principal, student_id, now)
            key = student['eligibility_key']
            old = self.db.execute('SELECT * FROM trials WHERE eligibility_key=? AND product=?', (key, PRODUCT)).fetchone()
            if old:
                return dict(old)  # Expired/canceled claims are NEVER restarted.
            self.db.execute('INSERT INTO trials VALUES (?,?,?,?,?,NULL)', (key, PRODUCT, student_id, now, now + 604800))
            return dict(self.db.execute('SELECT * FROM trials WHERE eligibility_key=? AND product=?', (key, PRODUCT)).fetchone())

    def cancel_trial(self, principal, student_id, now):
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            student = self.student(principal, student_id, now)
            self.db.execute('UPDATE trials SET canceled_at=COALESCE(canceled_at,?) WHERE eligibility_key=? AND product=?', (now, student['eligibility_key'], PRODUCT))

    def can_study(self, principal, student_id, now):
        student = self.student(principal, student_id, now)
        paid = self.db.execute("SELECT 1 FROM subscriptions WHERE student_id=? AND status IN ('active','cancel_at_period_end') AND starts_at<=? AND ends_at>?", (student_id, now, now)).fetchone()
        trial = self.db.execute('SELECT 1 FROM trials WHERE eligibility_key=? AND student_id=? AND product=? AND canceled_at IS NULL AND starts_at<=? AND ends_at>?', (student['eligibility_key'], student_id, PRODUCT, now, now)).fetchone()
        return bool(paid or trial)

    def import_progress(self, principal, student_id, request_id, raw, now):
        identifier(request_id)
        answers = parse_snapshot(raw)
        digest = hashlib.sha256(json.dumps(answers, separators=(',', ':')).encode()).hexdigest()
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            self.student(principal, student_id, now)
            old = self.db.execute('SELECT * FROM imports WHERE student_id=? AND request_id=?', (student_id, request_id)).fetchone()
            if old:
                if old['digest'] != digest:
                    raise Conflict('Idempotency key reused with different content')
                return json.loads(old['result'])
            result = {'inserted': [], 'keptExisting': []}
            for qid, choice, attempts, done in answers:
                cur = self.db.execute("INSERT INTO lesson_progress VALUES (?,?,?,?,?,?, 'local-import') ON CONFLICT(student_id,question_id,content_version) DO NOTHING", (student_id, qid, CATALOG['contentVersion'], choice, attempts, done))
                result['inserted' if cur.rowcount else 'keptExisting'].append(qid)
            self.db.execute('INSERT INTO imports VALUES (?,?,?,?)', (student_id, request_id, digest, json.dumps(result)))
            return result

    def support(self, principal, channel, event_id, kind, message, now):
        identifier(event_id)
        if channel not in ('web', 'whatsapp') or kind not in ('question', 'problem', 'complaint', 'suggestion'):
            raise ValueError('Invalid support category')
        if not isinstance(message, str) or not message.strip() or len(message) > 1200:
            raise ValueError('Invalid support message')
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            self.account(principal, now)
            old = self.db.execute('SELECT * FROM support_tickets WHERE channel=? AND event_id=?', (channel, event_id)).fetchone()
            if old:
                if (old['account_id'], old['kind'], old['message']) != (principal.account_id, kind, message):
                    raise Conflict('Event collision')
                return old['id']
            ticket_id = str(uuid.uuid4())
            state = 'awaiting_staff' if kind in ('complaint', 'suggestion') else 'new'
            self.db.execute('INSERT INTO support_tickets VALUES (?,?,?,?,?,?,?,?)', (ticket_id, principal.account_id, channel, event_id, kind, message, state, now))
        return ticket_id  # Only returned AFTER successful commit.
