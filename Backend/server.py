python
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'overstock-secret-key-2026')
JWT_ALGORITHM = 'HS256'

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str

class TokenResponse(BaseModel):
    token: str
    user: User

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    codigo_id: str
    nombre: str
    stock_actual: int
    stock_minimo: int

class ProductCreate(BaseModel):
    codigo_id: str
    nombre: str
    stock_inicial: int = 0
    stock_minimo: int = 10

class ProductDelete(BaseModel):
    motivo: str

class Movement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    fecha: str
    usuario: str
    producto_id: str
    producto_nombre: str
    tipo: Literal["Entrada", "Salida", "Eliminación"]
    cantidad: int
    motivo: Optional[str] = None

class MovementCreate(BaseModel):
    producto_id: str
    tipo: Literal["Entrada", "Salida"]
    cantidad: int

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    mensaje: str
    fecha: str
    leida: bool = False

# Auth helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(email: str) -> str:
    payload = {
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = cre...als
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get('email')
        user = await db.users.find_one({'email': email}, {'_id': 0, 'password_hash': 0})
        if not user:
            raise HTTPException(status_code=401, detail='Usuario no autorizado')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expirado')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token inválido')

# Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    existing = await db.users.find_one({'email': data.email})
    if existing:
        raise HTTPException(status_code=400, detail='El email ya está registrado')
    
    user_doc = {
        'email': data.email,
        'name': data.name,
        'password_hash': hash_password(data.password)
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(data.email)
    return TokenResponse(
        token=token,
        user=User(email=data.email, name=data.name)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({'email': data.email})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Credenciales incorrectas')
    
    token = create_token(data.email)
    return TokenResponse(
        token=token,
        user=User(email=user['email'], name=user['name'])
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(user: dict = Depends(get_current_user)):
    return User(**user)

@api_router.get("/products", response_model=List[Product])
async def get_products(user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {'_id': 0}).to_list(1000)
    return products

@api_router.get("/products/{codigo_id}", response_model=Product)
async def get_product(codigo_id: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({'codigo_id': codigo_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail='Producto no encontrado')
    return product

@api_router.post("/products", response_model=Product)
async def create_product(data: ProductCreate, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({'codigo_id': data.codigo_id})
    if existing:
        raise HTTPException(status_code=400, detail='El código ya existe')
    
    # Create product with stock_actual = stock_inicial
    product_doc = {
        'codigo_id': data.codigo_id,
        'nombre': data.nombre,
        'stock_actual': data.stock_inicial,
        'stock_minimo': data.stock_minimo
    }
    await db.products.insert_one(product_doc)
    
    # If stock_inicial > 0, create initial entry movement
    if data.stock_inicial > 0:
        movement_doc = {
            'fecha': datetime.now(timezone.utc).isoformat(),
            'usuario': user['name'],
            'producto_id': data.codigo_id,
            'producto_nombre': data.nombre,
            'tipo': 'Entrada',
            'cantidad': data.stock_inicial
        }
        await db.movements.insert_one(movement_doc)
        
        # Create notification
        notification_doc = {
            'id': f"notif_{datetime.now(timezone.utc).timestamp()}",
            'mensaje': f"{user['name']} creó el producto '{data.nombre}' con stock inicial de {data.stock_inicial} unidades",
            'fecha': datetime.now(timezone.utc).isoformat(),
            'leida': False
        }
        await db.notifications.insert_one(notification_doc)
    
    return Product(**product_doc)

@api_router.get("/alerts", response_model=List[Product])
async def get_alerts(user: dict = Depends(get_current_user)):
    alerts = await db.products.find(
        {'$expr': {'$lt': ['$stock_actual', '$stock_minimo']}},
        {'_id': 0}
    ).to_list(1000)
    return alerts

@api_router.delete("/products/{codigo_id}")
async def delete_product(codigo_id: str, data: ProductDelete, user: dict = Depends(get_current_user)):
    # Get product before deletion
    product = await db.products.find_one({'codigo_id': codigo_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail='Producto no encontrado')
    
    # Create audit record in movements (before deletion)
    audit_doc = {
        'fecha': datetime.now(timezone.utc).isoformat(),
        'usuario': user['name'],
        'producto_id': codigo_id,
        'producto_nombre': product['nombre'],
        'tipo': 'Eliminación',
        'cantidad': 0,
        'motivo': data.motivo
    }
    await db.movements.insert_one(audit_doc)
    
    # Create notification for team
    notification_doc = {
        'id': f"notif_{datetime.now(timezone.utc).timestamp()}",
        'mensaje': f"🚨 {user['name']} eliminó {product['nombre']}. Motivo: {data.motivo}",
        'fecha': datetime.now(timezone.utc).isoformat(),
        'leida': False
    }
    await db.notifications.insert_one(notification_doc)
    
    # Delete product
    await db.products.delete_one({'codigo_id': codigo_id})
    
    return {'status': 'ok', 'message': 'Producto eliminado correctamente'}

@api_router.post("/movements", response_model=Movement)
async def create_movement(data: MovementCreate, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({'codigo_id': data.producto_id})
    if not product:
        raise HTTPException(status_code=404, detail='Producto no encontrado')
    
    # Update stock
    if data.tipo == 'Entrada':
        new_stock = product['stock_actual'] + data.cantidad
    else:
        new_stock = product['stock_actual'] - data.cantidad
        if new_stock < 0:
            raise HTTPException(status_code=400, detail='Stock insuficiente')
    
    await db.products.update_one(
        {'codigo_id': data.producto_id},
        {'$set': {'stock_actual': new_stock}}
    )
    
    # Create movement record
    movement_doc = {
        'fecha': datetime.now(timezone.utc).isoformat(),
        'usuario': user['name'],
        'producto_id': data.producto_id,
        'producto_nombre': product['nombre'],
        'tipo': data.tipo,
        'cantidad': data.cantidad
    }
    await db.movements.insert_one(movement_doc)
    
    # Create notification for all users
    notification_doc = {
        'id': f"notif_{datetime.now(timezone.utc).timestamp()}",
        'mensaje': f"{user['name']} registró {data.tipo.lower()} de {data.cantidad} unidades de {product['nombre']}. Stock actual: {new_stock}",
        'fecha': datetime.now(timezone.utc).isoformat(),
        'leida': False
    }
    await db.notifications.insert_one(notification_doc)
    
    return Movement(**movement_doc)

@api_router.get("/movements", response_model=List[Movement])
async def get_movements(user: dict = Depends(get_current_user)):
    movements = await db.movements.find({}, {'_id': 0}).sort('fecha', -1).to_list(100)
    return movements

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({}, {'_id': 0}).sort('fecha', -1).to_list(50)
    return notifications

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {'id': notif_id},
        {'$set': {'leida': True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail='Notificación no encontrada')
    return {'status': 'ok'}

@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    result = await db.notifications.update_many(
        {'leida': False},
        {'$set': {'leida': True}}
    )
    return {'status': 'ok', 'modified_count': result.modified_count}

@api_router.get("/movements/recent", response_model=List[Movement])
async def get_recent_movements(user: dict = Depends(get_current_user)):
    # Get movements from last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    movements = await db.movements.find(
        {'fecha': {'$gte': seven_days_ago.isoformat()}},
        {'_id': 0}
    ).sort('fecha', -1).to_list(100)
    return movements

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()