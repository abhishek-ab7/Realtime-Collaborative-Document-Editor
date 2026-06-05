import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_document_123_unauthenticated_returns_401():
    url = f"{BASE_URL}/api/documents/123"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status 401 but got {response.status_code}"
    # Optionally check for presence of unauthorized error in response body if applicable:
    # assert "unauthorized" in response.text.lower()

test_get_document_123_unauthenticated_returns_401()