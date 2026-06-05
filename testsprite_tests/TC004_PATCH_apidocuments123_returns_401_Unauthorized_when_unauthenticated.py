import requests

def test_patch_document_unauthenticated_returns_401():
    base_url = "http://localhost:3000"
    document_id = "123"
    url = f"{base_url}/api/documents/{document_id}"
    payload = {"title": "Updated Title"}
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.patch(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"

test_patch_document_unauthenticated_returns_401()