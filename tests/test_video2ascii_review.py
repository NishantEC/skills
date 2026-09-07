"""Review server contract: standalone assets, preset input and failed rebakes."""
import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SKILL = Path(__file__).resolve().parents[1] / 'skills/video2ascii'


class ReviewTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.frames = Path(self.tmp.name) / 'frames.json'
        self.data = {'cols': 2, 'rows': 1, 'count': 1, 'levels': ['0f']}
        self.frames.write_text(json.dumps(self.data))
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        self.url = f'http://127.0.0.1:{port}/'
        self.process = subprocess.Popen([
            sys.executable, str(SKILL / 'scripts/review.py'), self.tmp.name,
            '--port', str(port), '--no-open', '--title', '<Review & tune>',
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                with urlopen(self.url, timeout=1) as response:
                    self.page = response.read().decode()
                break
            except URLError:
                time.sleep(.02)
        else:
            self.tearDown()
            self.fail('review server did not start')

    def tearDown(self):
        self.process.terminate()
        self.process.wait(timeout=5)
        self.tmp.cleanup()

    def test_offline_page_bundles_adapter_and_escapes_title(self):
        self.assertIn('var DialKit =', self.page)
        self.assertIn('.dialkit-root', self.page)
        self.assertNotIn('__DIALKIT_', self.page)
        self.assertNotRegex(self.page, r'<(?:script|link)[^>]+(?:src|href)=')
        self.assertIn('<title>&lt;Review &amp; tune&gt;</title>', self.page)
        self.assertIn('"canRebake": false', self.page)

    def test_failed_rebake_preserves_original_data(self):
        self.data['cmd'] = [str(Path(self.tmp.name) / 'missing.py')]
        self.frames.write_text(json.dumps(self.data))
        before = self.frames.read_bytes()
        req = Request(self.url + 'rebake', data=b'{"cols":84}',
                      headers={'Content-Type':'application/json'})
        with self.assertRaises(HTTPError) as error:
            urlopen(req, timeout=5)
        self.assertEqual(error.exception.code, 500)
        self.assertIn('error', json.load(error.exception))
        error.exception.close()
        self.assertEqual(self.frames.read_bytes(), before)
        self.assertFalse(self.frames.with_suffix('.json.bak').exists())

    def test_legacy_workdir_cannot_rebake(self):
        req = Request(self.url + 'rebake', data=b'{"cols":84}')
        with self.assertRaises(HTTPError) as error:
            urlopen(req, timeout=5)
        self.assertEqual(error.exception.code, 500)
        self.assertIn('does not record', json.load(error.exception)['error'])
        error.exception.close()


if __name__ == '__main__':
    unittest.main()
