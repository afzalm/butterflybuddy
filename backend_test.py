
import requests
import json
from datetime import datetime
import time
import random

# Base URL for the API
BASE_URL = "http://localhost:8001/api"

# Test data
test_teacher = {
    "email": "teacher@test.com",
    "password": "test123",
    "name": "Test Teacher",
    "school_name": "Test School"
}

test_student = {
    "name": "Test Student",
    "student_id": "S12345",
    "class_name": "Class A",
    "grade": "10"
}

test_policy_update = {
    "blocked_sites": ["facebook.com", "instagram.com", "tiktok.com"],
    "allowed_sites": {
        "Khan Academy": "https://www.khanacademy.org",
        "Wikipedia": "https://www.wikipedia.org",
        "Google Classroom": "https://classroom.google.com"
    },
    "controlled_sites": ["youtube.com", "twitter.com"],
    "daily_time_limit": 7200  # 2 hours in seconds
}

test_usage_log = {
    "student_hash": "",  # Will be filled after teacher registration
    "url": "https://www.example.com",
    "title": "Example Website",
    "timestamp": datetime.utcnow().isoformat(),
    "duration": 300,  # 5 minutes
    "is_blocked": False
}

# Global variables to store data between tests
teacher_token = None
teacher_hash_key = None
student_id = None

def test_health_check():
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✅ Health check passed")

def test_teacher_registration():
    print("\n=== Testing Teacher Registration ===")
    global teacher_hash_key
    
    # Test registration with new teacher
    response = requests.post(f"{BASE_URL}/teachers/register", json=test_teacher)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 400 and "Teacher already registered" in response.json().get("detail", ""):
        print("Teacher already exists, proceeding with login test")
        return True
    
    assert response.status_code == 200
    assert "hash_key" in response.json()
    assert "teacher_id" in response.json()
    
    teacher_hash_key = response.json()["hash_key"]
    print(f"Teacher Hash Key: {teacher_hash_key}")
    print("✅ Teacher registration passed")
    return True

def test_teacher_login():
    print("\n=== Testing Teacher Login ===")
    global teacher_token
    
    response = requests.post(f"{BASE_URL}/teachers/login", json={
        "email": test_teacher["email"],
        "password": test_teacher["password"]
    })
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "teacher" in response.json()
    
    teacher_token = response.json()["access_token"]
    
    # If we didn't get the hash_key from registration, get it from login
    global teacher_hash_key
    if not teacher_hash_key:
        teacher_hash_key = response.json()["teacher"]["hash_key"]
        print(f"Teacher Hash Key: {teacher_hash_key}")
    
    print("✅ Teacher login passed")
    return True

def test_student_management():
    print("\n=== Testing Student Management ===")
    global student_id
    
    # Create a student
    headers = {"Authorization": f"Bearer {teacher_token}"}
    
    # Create multiple students
    students = []
    for i in range(3):
        student = {
            "name": f"Test Student {i+1}",
            "student_id": f"S{1000+i}",
            "class_name": f"Class {chr(65+i)}",
            "grade": str(random.randint(6, 12))
        }
        students.append(student)
    
    for student in students:
        response = requests.post(f"{BASE_URL}/students", json=student, headers=headers)
        print(f"Creating student {student['name']}")
        print(f"Status Code: {response.status_code}")
        
        assert response.status_code == 200
        assert "student" in response.json()
        
        if not student_id:  # Save the first student ID
            student_id = response.json()["student"]["_id"]
    
    # Get all students
    response = requests.get(f"{BASE_URL}/students", headers=headers)
    print(f"\nGetting all students")
    print(f"Status Code: {response.status_code}")
    print(f"Found {len(response.json()['students'])} students")
    
    assert response.status_code == 200
    assert "students" in response.json()
    assert len(response.json()["students"]) >= len(students)
    
    # Get a specific student
    if student_id:
        response = requests.get(f"{BASE_URL}/students/{student_id}", headers=headers)
        print(f"\nGetting specific student with ID: {student_id}")
        print(f"Status Code: {response.status_code}")
        
        assert response.status_code == 200
        assert "student" in response.json()
        assert response.json()["student"]["_id"] == student_id
    
    print("✅ Student management passed")
    return True

def test_policy_management():
    print("\n=== Testing Policy Management ===")
    
    headers = {"Authorization": f"Bearer {teacher_token}"}
    
    # Get current policies
    response = requests.get(f"{BASE_URL}/policies", headers=headers)
    print(f"Getting current policies")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "policy" in response.json()
    
    # Update policies
    response = requests.put(f"{BASE_URL}/policies", json=test_policy_update, headers=headers)
    print(f"\nUpdating policies")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    
    # Verify the update
    response = requests.get(f"{BASE_URL}/policies", headers=headers)
    print(f"\nVerifying policy update")
    print(f"Status Code: {response.status_code}")
    
    assert response.status_code == 200
    policy = response.json()["policy"]
    assert "blocked_sites" in policy
    assert "facebook.com" in policy["blocked_sites"]
    assert "allowed_sites" in policy
    assert "Google Classroom" in policy["allowed_sites"]
    assert policy["daily_time_limit"] == 7200
    
    print("✅ Policy management passed")
    return True

def test_extension_api():
    print("\n=== Testing Extension API ===")
    
    # Test getting policy with hash key
    response = requests.post(f"{BASE_URL}/extension/policy", json={"hash_key": teacher_hash_key})
    print(f"Getting policy with hash key")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "blocked_sites" in response.json()
    assert "allowed_sites" in response.json()
    assert "daily_time_limit" in response.json()
    
    # Test logging usage
    test_usage_log["student_hash"] = teacher_hash_key
    test_usage_log["timestamp"] = datetime.utcnow().isoformat()
    
    response = requests.post(f"{BASE_URL}/extension/usage", json=test_usage_log)
    print(f"\nLogging usage")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert "message" in response.json()
    
    print("✅ Extension API passed")
    return True

def test_analytics():
    print("\n=== Testing Analytics ===")
    
    headers = {"Authorization": f"Bearer {teacher_token}"}
    
    # Test usage analytics
    response = requests.get(f"{BASE_URL}/dashboard/usage", headers=headers)
    print(f"Getting usage analytics")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "total_usage" in response.json()
    assert "blocked_attempts" in response.json()
    assert "recent_logs" in response.json()
    
    # Test student activity
    response = requests.get(f"{BASE_URL}/dashboard/students/activity", headers=headers)
    print(f"\nGetting student activity")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "student_activity" in response.json()
    
    print("✅ Analytics passed")
    return True

def run_all_tests():
    tests = [
        ("Health Check", test_health_check),
        ("Teacher Registration", test_teacher_registration),
        ("Teacher Login", test_teacher_login),
        ("Student Management", test_student_management),
        ("Policy Management", test_policy_management),
        ("Extension API", test_extension_api),
        ("Analytics", test_analytics)
    ]
    
    results = {}
    
    for name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"RUNNING TEST: {name}")
        print(f"{'='*50}")
        
        try:
            success = test_func()
            results[name] = "✅ PASSED" if success else "❌ FAILED"
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            results[name] = f"❌ ERROR: {str(e)}"
    
    print("\n\n")
    print("="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    for name, result in results.items():
        print(f"{name}: {result}")

if __name__ == "__main__":
    run_all_tests()
