import requests

def test_post_api_documents_unauthenticated_returns_401():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/documents"
    payload = {
        "title": "Sample Document"
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected status code 401 but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_post_api_documents_unauthenticated_returns_401()