from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import bcrypt
import shortuuid
from jose import JWTError, jwt
from dotenv import load_dotenv
import uuid
import re

load_dotenv()

app = FastAPI(title="Butterfly Buddy Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "butterfly_buddy")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]
security = HTTPBearer()

# Collections
teachers_collection = db.teachers
students_collection = db.students
policies_collection = db.policies
usage_collection = db.usage_logs

# Pydantic Models
class TeacherCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    school_name: str

class TeacherLogin(BaseModel):
    email: EmailStr
    password: str

class StudentCreate(BaseModel):
    name: str
    student_id: str
    class_name: str
    grade: str

class PolicyUpdate(BaseModel):
    blocked_sites: List[str] = []
    allowed_sites: Dict[str, str] = {}
    controlled_sites: List[str] = []
    daily_time_limit: int = 3600  # seconds
    
class UsageLog(BaseModel):
    student_hash: str
    url: str
    title: str
    timestamp: datetime
    duration: int = 0
    is_blocked: bool = False

class HashKeyRequest(BaseModel):
    hash_key: str

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_hash_key() -> str:
    return shortuuid.ShortUUID().random(length=5).upper()

async def get_current_teacher(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: str = payload.get("sub")
        if teacher_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        teacher = await teachers_collection.find_one({"_id": teacher_id})
        if teacher is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Teacher not found",
            )
        return teacher
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Teacher Authentication
@app.post("/api/teachers/register")
async def register_teacher(teacher: TeacherCreate):
    # Check if teacher already exists
    existing = await teachers_collection.find_one({"email": teacher.email})
    if existing:
        raise HTTPException(status_code=400, detail="Teacher already registered")
    
    # Create teacher
    teacher_id = str(uuid.uuid4())
    hash_key = generate_hash_key()
    
    teacher_doc = {
        "_id": teacher_id,
        "email": teacher.email,
        "password": hash_password(teacher.password),
        "name": teacher.name,
        "school_name": teacher.school_name,
        "hash_key": hash_key,
        "created_at": datetime.utcnow()
    }
    
    await teachers_collection.insert_one(teacher_doc)
    
    # Create default policy
    policy_doc = {
        "_id": str(uuid.uuid4()),
        "teacher_id": teacher_id,
        "blocked_sites": ["rediff.com", "gaming.example.com"],
        "allowed_sites": {
            "Khan Academy": "https://www.khanacademy.org",
            "Wikipedia": "https://www.wikipedia.org",
            "Google Scholar": "https://scholar.google.com"
        },
        "controlled_sites": ["facebook.com", "twitter.com", "youtube.com"],
        "daily_time_limit": 3600,
        "created_at": datetime.utcnow()
    }
    
    await policies_collection.insert_one(policy_doc)
    
    return {
        "message": "Teacher registered successfully",
        "hash_key": hash_key,
        "teacher_id": teacher_id
    }

@app.post("/api/teachers/login")
async def login_teacher(teacher: TeacherLogin):
    teacher_doc = await teachers_collection.find_one({"email": teacher.email})
    if not teacher_doc or not verify_password(teacher.password, teacher_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)))
    access_token = create_access_token(
        data={"sub": teacher_doc["_id"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "teacher": {
            "id": teacher_doc["_id"],
            "name": teacher_doc["name"],
            "email": teacher_doc["email"],
            "hash_key": teacher_doc["hash_key"],
            "school_name": teacher_doc["school_name"]
        }
    }

# Student Management
@app.post("/api/students")
async def create_student(student: StudentCreate, current_teacher: dict = Depends(get_current_teacher)):
    student_id = str(uuid.uuid4())
    student_doc = {
        "_id": student_id,
        "teacher_id": current_teacher["_id"],
        "teacher_hash": current_teacher["hash_key"],
        "name": student.name,
        "student_id": student.student_id,
        "class_name": student.class_name,
        "grade": student.grade,
        "created_at": datetime.utcnow(),
        "last_active": None
    }
    
    await students_collection.insert_one(student_doc)
    return {"message": "Student created successfully", "student": student_doc}

@app.get("/api/students")
async def get_students(current_teacher: dict = Depends(get_current_teacher)):
    students = await students_collection.find({"teacher_id": current_teacher["_id"]}).to_list(100)
    return {"students": students}

@app.get("/api/students/{student_id}")
async def get_student(student_id: str, current_teacher: dict = Depends(get_current_teacher)):
    student = await students_collection.find_one({
        "_id": student_id,
        "teacher_id": current_teacher["_id"]
    })
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"student": student}

# Policy Management
@app.get("/api/policies")
async def get_policies(current_teacher: dict = Depends(get_current_teacher)):
    policy = await policies_collection.find_one({"teacher_id": current_teacher["_id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"policy": policy}

@app.put("/api/policies")
async def update_policies(policy_update: PolicyUpdate, current_teacher: dict = Depends(get_current_teacher)):
    policy = await policies_collection.find_one({"teacher_id": current_teacher["_id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    updated_policy = {
        "blocked_sites": policy_update.blocked_sites,
        "allowed_sites": policy_update.allowed_sites,
        "controlled_sites": policy_update.controlled_sites,
        "daily_time_limit": policy_update.daily_time_limit,
        "updated_at": datetime.utcnow()
    }
    
    await policies_collection.update_one(
        {"teacher_id": current_teacher["_id"]},
        {"$set": updated_policy}
    )
    
    return {"message": "Policy updated successfully"}

# Chrome Extension API Routes
@app.post("/api/extension/policy")
async def get_extension_policy(request: HashKeyRequest):
    teacher = await teachers_collection.find_one({"hash_key": request.hash_key})
    if not teacher:
        raise HTTPException(status_code=404, detail="Invalid hash key")
    
    policy = await policies_collection.find_one({"teacher_id": teacher["_id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    return {
        "blocked_sites": policy.get("blocked_sites", []),
        "allowed_sites": policy.get("allowed_sites", {}),
        "controlled_sites": policy.get("controlled_sites", []),
        "daily_time_limit": policy.get("daily_time_limit", 3600)
    }

@app.post("/api/extension/usage")
async def log_usage(usage: UsageLog):
    # Find teacher by hash key
    teacher = await teachers_collection.find_one({"hash_key": usage.student_hash})
    if not teacher:
        raise HTTPException(status_code=404, detail="Invalid hash key")
    
    # Log usage
    usage_doc = {
        "_id": str(uuid.uuid4()),
        "teacher_id": teacher["_id"],
        "student_hash": usage.student_hash,
        "url": usage.url,
        "title": usage.title,
        "timestamp": usage.timestamp,
        "duration": usage.duration,
        "is_blocked": usage.is_blocked
    }
    
    await usage_collection.insert_one(usage_doc)
    
    # Update student last active
    await students_collection.update_one(
        {"teacher_hash": usage.student_hash},
        {"$set": {"last_active": usage.timestamp}}
    )
    
    return {"message": "Usage logged successfully"}

# Dashboard Analytics
@app.get("/api/dashboard/usage")
async def get_usage_analytics(current_teacher: dict = Depends(get_current_teacher)):
    # Get usage logs for past 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    usage_logs = await usage_collection.find({
        "teacher_id": current_teacher["_id"],
        "timestamp": {"$gte": seven_days_ago}
    }).to_list(1000)
    
    # Get blocked site attempts
    blocked_attempts = await usage_collection.find({
        "teacher_id": current_teacher["_id"],
        "is_blocked": True,
        "timestamp": {"$gte": seven_days_ago}
    }).to_list(100)
    
    return {
        "total_usage": len(usage_logs),
        "blocked_attempts": len(blocked_attempts),
        "recent_logs": usage_logs[-50:],  # Last 50 logs
        "blocked_logs": blocked_attempts
    }

@app.get("/api/dashboard/students/activity")
async def get_student_activity(current_teacher: dict = Depends(get_current_teacher)):
    students = await students_collection.find({"teacher_id": current_teacher["_id"]}).to_list(100)
    
    activity_data = []
    for student in students:
        # Get recent activity for this student
        recent_usage = await usage_collection.find({
            "teacher_id": current_teacher["_id"],
            "student_hash": student["teacher_hash"]
        }).sort("timestamp", -1).limit(10).to_list(10)
        
        activity_data.append({
            "student": student,
            "recent_activity": recent_usage
        })
    
    return {"student_activity": activity_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
