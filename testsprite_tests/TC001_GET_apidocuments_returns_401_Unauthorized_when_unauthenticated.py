import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_documents_unauthenticated_returns_401():
    url = f"{BASE_URL}/api/documents"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"
        # Optionally check error message content if returned as JSON
        try:
            data = response.json()
            # Some APIs include error fields in the response body for 401
            assert "error" in data or "message" in data, "Response JSON should contain error or message field"
        except ValueError:
            # Response is not JSON, which can be valid
            pass
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_documents_unauthenticated_returns_401()