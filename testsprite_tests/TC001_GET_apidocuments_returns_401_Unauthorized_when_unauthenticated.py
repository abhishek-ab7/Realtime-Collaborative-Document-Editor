import requests

def test_get_api_documents_unauthenticated_returns_401():
    url = "http://localhost:3000/api/documents"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
        # Optionally check response body for unauthorized error indication
        json_resp = {}
        try:
            json_resp = response.json()
        except Exception:
            pass
        # Validate that some kind of unauthorized error is indicated in the body (optional)
        assert (
            "error" in json_resp or "message" in json_resp or len(json_resp) == 0
        ), "Response body does not indicate unauthorized error as expected"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_get_api_documents_unauthenticated_returns_401()