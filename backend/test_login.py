import requests

url = "http://127.0.0.1:5000/api/auth/register"
res = requests.post(url, json={
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "password123"
})
print("Register:", res.status_code, res.text)

url = "http://127.0.0.1:5000/api/auth/login"
# Test with email
res = requests.post(url, json={
    "email": "testuser@example.com",
    "password": "password123"
})
print("Login (Email):", res.status_code, res.text)

# Test with username
res = requests.post(url, json={
    "username": "testuser",
    "password": "password123"
})
print("Login (Username):", res.status_code, res.text)
