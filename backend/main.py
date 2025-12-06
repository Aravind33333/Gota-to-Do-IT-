from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import pymysql
import hashlib
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello from FastAPI!"}


# Database helper function
def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

# Create users table if not exists
def create_users_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                oauth_provider VARCHAR(50),
                oauth_id VARCHAR(255),
                picture TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✓ Users table ready")
    except Exception as e:
        print(f"✗ Error creating table: {e}")

# Create table on startup
try:
    create_users_table()
except Exception as e:
    print(f"✗ Database connection failed: {e}")

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str | None = None
    oauth_provider: str | None = None
    oauth_id: str | None = None
    picture: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str

class OAuthLogin(BaseModel):
    email: str
    oauth_provider: str
    oauth_id: str
    username: str = None
    picture: str = None

@app.get("/connect_db")
def connect_db():
    try:
        conn = get_db_connection()
        conn.close()
        return {"message": "Connected to MySQL database successfully!"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/register")
def register_user(user: UserRegister):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password if provided
        hashed_password = None
        if user.password:
            hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (username, email, password, oauth_provider, oauth_id, picture)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user.username, user.email, hashed_password, user.oauth_provider, user.oauth_id, user.picture))
        
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return {"message": "User registered successfully", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login_user(user: UserLogin):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        db_user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user registered with OAuth (no password)
        if db_user['password'] is None:
            raise HTTPException(status_code=401, detail="This account uses Google sign-in. Please sign in with Google.")
        
        # Verify password
        hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
        if db_user['password'] != hashed_password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Return user info
        return {
            "message": "Login successful",
            "user": {
                "id": db_user['id'],
                "username": db_user['username'],
                "email": db_user['email'],
                "picture": db_user['picture']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/oauth_login")
def oauth_login(user: OAuthLogin):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by email and oauth_id
        cursor.execute(
            "SELECT * FROM users WHERE email = %s AND oauth_provider = %s AND oauth_id = %s",
            (user.email, user.oauth_provider, user.oauth_id)
        )
        db_user = cursor.fetchone()
        
        # If user doesn't exist, auto-register them
        if not db_user:
            print(f"Auto-registering new OAuth user: {user.email}")
            cursor.execute("""
                INSERT INTO users (username, email, password, oauth_provider, oauth_id, picture)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user.username or user.email.split('@')[0], user.email, None, user.oauth_provider, user.oauth_id, user.picture))
            conn.commit()
            user_id = cursor.lastrowid
            
            # Fetch the newly created user
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            db_user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Return user info
        return {
            "message": "Login successful",
            "user": {
                "id": db_user['id'],
                "username": db_user['username'],
                "email": db_user['email'],
                "picture": db_user['picture']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))