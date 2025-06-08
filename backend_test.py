import requests
import unittest
import json
import time
import os

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://0c3a75d9-8659-48fe-bf7a-8e63bead02a7.preview.emergentagent.com"

class SongSnapsAPITest(unittest.TestCase):
    """Test suite for SongSnaps API endpoints"""
    
    def setUp(self):
        """Setup for each test"""
        self.base_url = BACKEND_URL
        self.order_id = None
    
    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = requests.get(f"{self.base_url}/api/health")
        
        self.assertEqual(response.status_code, 200, "Health check should return 200")
        data = response.json()
        self.assertEqual(data["status"], "healthy", "Health status should be 'healthy'")
        self.assertEqual(data["database"], "connected", "Database should be 'connected'")
        self.assertTrue("timestamp" in data, "Response should include timestamp")
        print("✅ Health check endpoint test passed")
    
    def test_02_generate_order(self):
        """Test order generation endpoint"""
        print("\n🔍 Testing order generation endpoint...")
        
        # Test subscription plan
        payload = {"plan": "subscription", "express": False}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 200, "Order generation should return 200")
        data = response.json()
        self.assertTrue("orderId" in data, "Response should include orderId")
        self.assertEqual(data["plan"], "subscription", "Plan should be 'subscription'")
        self.assertEqual(data["express"], False, "Express should be False")
        self.assertTrue("timestamp" in data, "Response should include timestamp")
        self.assertTrue("whatsappNumber" in data, "Response should include whatsappNumber")
        
        # Save order ID for later tests
        self.order_id = data["orderId"]
        print(f"✅ Order generation test passed - Created order ID: {self.order_id}")
        
        # Test oneoff plan with express
        payload = {"plan": "oneoff", "express": True}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 200, "Order generation should return 200")
        data = response.json()
        self.assertEqual(data["plan"], "oneoff", "Plan should be 'oneoff'")
        self.assertEqual(data["express"], True, "Express should be True")
        print("✅ Order generation with express test passed")
        
        # Test invalid plan
        payload = {"plan": "invalid_plan", "express": False}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 400, "Invalid plan should return 400")
        print("✅ Invalid plan test passed")
    
    def test_03_get_order(self):
        """Test get order by ID endpoint"""
        print("\n🔍 Testing get order endpoint...")
        
        # Skip if no order ID from previous test
        if not self.order_id:
            self.skipTest("No order ID available from previous test")
        
        response = requests.get(f"{self.base_url}/api/order/{self.order_id}")
        
        self.assertEqual(response.status_code, 200, "Get order should return 200")
        data = response.json()
        self.assertEqual(data["orderId"], self.order_id, "Order ID should match")
        self.assertEqual(data["plan"], "subscription", "Plan should be 'subscription'")
        self.assertEqual(data["express"], False, "Express should be False")
        self.assertEqual(data["status"], "payment_confirmed", "Status should be 'payment_confirmed'")
        self.assertEqual(data["fulfilled"], False, "Fulfilled should be False")
        print("✅ Get order test passed")
        
        # Test non-existent order
        response = requests.get(f"{self.base_url}/api/order/non-existent-id")
        
        self.assertEqual(response.status_code, 404, "Non-existent order should return 404")
        print("✅ Non-existent order test passed")
    
    def test_04_get_orders(self):
        """Test get all orders endpoint"""
        print("\n🔍 Testing get all orders endpoint...")
        
        response = requests.get(f"{self.base_url}/api/orders")
        
        self.assertEqual(response.status_code, 200, "Get orders should return 200")
        data = response.json()
        self.assertTrue("orders" in data, "Response should include orders array")
        self.assertTrue("count" in data, "Response should include count")
        self.assertTrue(isinstance(data["orders"], list), "Orders should be a list")
        self.assertTrue(data["count"] > 0, "There should be at least one order")
        print(f"✅ Get orders test passed - Found {data['count']} orders")
        
        # Test with limit parameter
        limit = 2
        response = requests.get(f"{self.base_url}/api/orders?limit={limit}")
        
        self.assertEqual(response.status_code, 200, "Get orders with limit should return 200")
        data = response.json()
        self.assertTrue(len(data["orders"]) <= limit, f"Should return at most {limit} orders")
        print(f"✅ Get orders with limit test passed")
        
        # Test with fulfilled filter
        response = requests.get(f"{self.base_url}/api/orders?fulfilled=false")
        
        self.assertEqual(response.status_code, 200, "Get unfulfilled orders should return 200")
        data = response.json()
        if data["count"] > 0:
            self.assertEqual(data["orders"][0]["fulfilled"], False, "Should only return unfulfilled orders")
        print("✅ Get orders with fulfilled filter test passed")
    
    def test_05_fulfill_order(self):
        """Test fulfill order endpoint"""
        print("\n🔍 Testing fulfill order endpoint...")
        
        # Skip if no order ID from previous test
        if not self.order_id:
            self.skipTest("No order ID available from previous test")
        
        response = requests.put(f"{self.base_url}/api/order/{self.order_id}/fulfill")
        
        self.assertEqual(response.status_code, 200, "Fulfill order should return 200")
        data = response.json()
        self.assertEqual(data["message"], "Order fulfilled successfully", "Should return success message")
        self.assertEqual(data["orderId"], self.order_id, "Order ID should match")
        print("✅ Fulfill order test passed")
        
        # Verify order is now fulfilled
        response = requests.get(f"{self.base_url}/api/order/{self.order_id}")
        
        self.assertEqual(response.status_code, 200, "Get order should return 200")
        data = response.json()
        self.assertEqual(data["fulfilled"], True, "Order should now be fulfilled")
        self.assertTrue("fulfilledAt" in data, "Should include fulfilledAt timestamp")
        print("✅ Order fulfillment verification passed")
        
        # Test non-existent order
        response = requests.put(f"{self.base_url}/api/order/non-existent-id/fulfill")
        
        self.assertEqual(response.status_code, 404, "Non-existent order should return 404")
        print("✅ Non-existent order fulfillment test passed")
    
    def test_06_stats(self):
        """Test stats endpoint"""
        print("\n🔍 Testing stats endpoint...")
        
        response = requests.get(f"{self.base_url}/api/stats")
        
        self.assertEqual(response.status_code, 200, "Stats should return 200")
        data = response.json()
        self.assertTrue("totalOrders" in data, "Response should include totalOrders")
        self.assertTrue("fulfilledOrders" in data, "Response should include fulfilledOrders")
        self.assertTrue("pendingOrders" in data, "Response should include pendingOrders")
        self.assertTrue("subscriptionOrders" in data, "Response should include subscriptionOrders")
        self.assertTrue("oneoffOrders" in data, "Response should include oneoffOrders")
        self.assertTrue("expressOrders" in data, "Response should include expressOrders")
        
        # Verify that total orders equals fulfilled + pending
        self.assertEqual(
            data["totalOrders"], 
            data["fulfilledOrders"] + data["pendingOrders"],
            "Total orders should equal fulfilled + pending"
        )
        print("✅ Stats endpoint test passed")

if __name__ == "__main__":
    unittest.main()