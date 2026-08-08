import importlib


def test_get_allowed_origins_parses_csv(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "http://localhost:3000,https://good.youthai.site",
    )
    backend_main = importlib.import_module("backend.main")

    assert backend_main.get_allowed_origins() == [
        "http://localhost:3000",
        "https://good.youthai.site",
    ]


def test_cookie_secure_enabled_true(monkeypatch):
    monkeypatch.setenv("COOKIE_SECURE", "true")
    backend_security = importlib.import_module("backend.security")

    assert backend_security.cookie_secure_enabled() is True


def test_cookie_secure_enabled_false(monkeypatch):
    monkeypatch.setenv("COOKIE_SECURE", "false")
    backend_security = importlib.import_module("backend.security")

    assert backend_security.cookie_secure_enabled() is False
