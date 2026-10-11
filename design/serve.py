"""Serves the site for checking it locally:  python design/serve.py [port]   (default 8000, on 127.0.0.1)

The same as `python -m http.server`, with a longer queue of waiting connections: the homepage asks for about
thirty modules at once, and the standard server's queue of five refused some of them now and then."""
import functools
import http.server
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    with Server(('127.0.0.1', port), handler) as httpd:
        print(f'serving {ROOT} on http://127.0.0.1:{port}/', flush=True)
        httpd.serve_forever()
