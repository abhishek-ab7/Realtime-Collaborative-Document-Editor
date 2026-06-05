import requests

def test_post_api_documents_unauthenticated_returns_401():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/documents"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "title": "Sample Document"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"

test_post_api_documents_unauthenticated_returns_401()