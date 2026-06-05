import requests

BASE_URL = "http://localhost:3000"
SIGNIN_ENDPOINT = "/api/auth/signin"
DASHBOARD_ENDPOINT = "/dashboard"
TIMEOUT = 30

def test_post_api_auth_signin_with_valid_credentials():
    session = requests.Session()
    signin_url = BASE_URL + SIGNIN_ENDPOINT
    dashboard_url = BASE_URL + DASHBOARD_ENDPOINT

    # Provide valid test user credentials (adjust email/password accordingly)
    credentials = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }

    # POST to /api/auth/signin with valid credentials
    try:
        signin_response = session.post(signin_url, json=credentials, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Signin request failed: {e}")

    # Assert status code 200
    assert signin_response.status_code == 200, f"Expected 200 OK but got {signin_response.status_code}"

    # Assert that a session cookie is set
    cookies = session.cookies
    assert cookies, "No cookies were set in the response."
    # Usually session cookie names vary, but let's check that some cookie exists
    assert any(cookies), "No session cookie found after sign-in."

    # Using the session with cookie, access authenticated route /dashboard
    try:
        dashboard_response = session.get(dashboard_url, timeout=TIMEOUT, allow_redirects=False)
    except requests.RequestException as e:
        raise AssertionError(f"Dashboard request failed: {e}")

    # Assert status 200 means access allowed
    assert dashboard_response.status_code == 200, f"Expected 200 OK for /dashboard but got {dashboard_response.status_code}"

test_post_api_auth_signin_with_valid_credentials()