import requests

BASE_URL = "http://localhost:3000"


def test_get_document_123_unauthenticated_returns_401():
    url = f"{BASE_URL}/api/documents/123"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"


test_get_document_123_unauthenticated_returns_401()