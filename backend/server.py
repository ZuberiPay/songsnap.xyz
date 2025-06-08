from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from datetime import datetime
from pymongo import MongoClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SongSnaps API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
try:
    client = MongoClient(MONGO_URL)
    db = client.songsnaps
    orders_collection = db.orders
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

# Pydantic models
class OrderRequest(BaseModel):
    plan: str  # 'subscription', 'oneoff', or 'express'
    express: bool = False

class OrderResponse(BaseModel):
    orderId: str
    plan: str
    express: bool
    timestamp: datetime
    whatsappNumber: str

@app.get("/")
async def root():
    return {"message": "SongSnaps API is running", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        orders_collection.find_one()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Service unhealthy")

@app.post("/api/generate-order", response_model=OrderResponse)
async def generate_order(order_request: OrderRequest):
    """Generate a unique order ID and store order details"""
    try:
        # Generate unique order ID
        order_id = f"SS-{uuid.uuid4().hex[:8].upper()}"
        
        # Validate plan
        valid_plans = ['subscription', 'oneoff', 'express']
        if order_request.plan not in valid_plans:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        # Create order document
        order_doc = {
            "orderId": order_id,
            "plan": order_request.plan,
            "express": order_request.express,
            "timestamp": datetime.now(),
            "status": "payment_confirmed",
            "whatsappNumber": "+1234567890",  # Replace with your actual WhatsApp number
            "fulfilled": False
        }
        
        # Store in database
        result = orders_collection.insert_one(order_doc)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        logger.info(f"Order created successfully: {order_id}")
        
        return OrderResponse(
            orderId=order_id,
            plan=order_request.plan,
            express=order_request.express,
            timestamp=order_doc["timestamp"],
            whatsappNumber=order_doc["whatsappNumber"]
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error generating order: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/order/{order_id}")
async def get_order(order_id: str):
    """Get order details by ID"""
    try:
        order = orders_collection.find_one({"orderId": order_id})
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Convert MongoDB document to dict and remove _id
        order.pop('_id', None)
        
        return order
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching order {order_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/api/order/{order_id}/fulfill")
async def fulfill_order(order_id: str):
    """Mark an order as fulfilled"""
    try:
        result = orders_collection.update_one(
            {"orderId": order_id},
            {
                "$set": {
                    "fulfilled": True,
                    "fulfilledAt": datetime.now()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        logger.info(f"Order {order_id} marked as fulfilled")
        
        return {"message": "Order fulfilled successfully", "orderId": order_id}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fulfilling order {order_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/orders")
async def get_orders(limit: int = 50, fulfilled: Optional[bool] = None):
    """Get list of orders with optional filtering"""
    try:
        query = {}
        if fulfilled is not None:
            query["fulfilled"] = fulfilled
        
        orders = list(orders_collection.find(query).sort("timestamp", -1).limit(limit))
        
        # Remove MongoDB _id from results
        for order in orders:
            order.pop('_id', None)
        
        return {"orders": orders, "count": len(orders)}
        
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/stats")
async def get_stats():
    """Get basic statistics"""
    try:
        total_orders = orders_collection.count_documents({})
        fulfilled_orders = orders_collection.count_documents({"fulfilled": True})
        pending_orders = total_orders - fulfilled_orders
        
        # Count by plan type
        subscription_orders = orders_collection.count_documents({"plan": "subscription"})
        oneoff_orders = orders_collection.count_documents({"plan": "oneoff"})
        express_orders = orders_collection.count_documents({"express": True})
        
        return {
            "totalOrders": total_orders,
            "fulfilledOrders": fulfilled_orders,
            "pendingOrders": pending_orders,
            "subscriptionOrders": subscription_orders,
            "oneoffOrders": oneoff_orders,
            "expressOrders": express_orders
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)