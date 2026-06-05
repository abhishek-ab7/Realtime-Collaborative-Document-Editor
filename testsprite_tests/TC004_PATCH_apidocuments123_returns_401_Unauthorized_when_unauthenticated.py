import requests

def test_PATCH_api_documents_123_unauthorized():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/documents/123"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "title": "Updated Title"
    }
    try:
        response = requests.patch(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    # Optionally check error structure/message in response if API returns JSON error details
    if response.headers.get("Content-Type", "").startswith("application/json"):
        json_resp = response.json()
        assert "error" in json_resp or "message" in json_resp, "Response JSON should contain error or message field"

test_PATCH_api_documents_123_unauthorized()