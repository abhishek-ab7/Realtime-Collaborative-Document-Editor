import requests

def test_delete_document_123_unauthenticated_returns_401():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/documents/123"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.delete(url, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected status code 401 but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_delete_document_123_unauthenticated_returns_401()