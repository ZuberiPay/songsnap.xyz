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
        self.order_ids = {}  # Store order IDs for each plan
    
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
    
    def test_02_get_plans(self):
        """Test the plans endpoint"""
        print("\n🔍 Testing plans endpoint...")
        response = requests.get(f"{self.base_url}/api/plans")
        
        self.assertEqual(response.status_code, 200, "Plans endpoint should return 200")
        data = response.json()
        self.assertTrue("plans" in data, "Response should include plans")
        
        plans = data["plans"]
        self.assertTrue("snap" in plans, "Plans should include 'snap'")
        self.assertTrue("snappack" in plans, "Plans should include 'snappack'")
        self.assertTrue("creator" in plans, "Plans should include 'creator'")
        
        # Verify snap plan details
        snap = plans["snap"]
        self.assertEqual(snap["name"], "Snap", "Snap name should be 'Snap'")
        self.assertEqual(snap["price"], "$3.99", "Snap price should be '$3.99'")
        self.assertEqual(snap["delivery"], "2 hours", "Snap delivery should be '2 hours'")
        
        # Verify snappack plan details
        snappack = plans["snappack"]
        self.assertEqual(snappack["name"], "Snap Pack", "Snap Pack name should be 'Snap Pack'")
        self.assertEqual(snappack["price"], "$9.99", "Snap Pack price should be '$9.99'")
        self.assertEqual(snappack["delivery"], "48 hours each", "Snap Pack delivery should be '48 hours each'")
        
        # Verify creator plan details
        creator = plans["creator"]
        self.assertEqual(creator["name"], "Creator Pack", "Creator Pack name should be 'Creator Pack'")
        self.assertEqual(creator["price"], "$24.99/mo", "Creator Pack price should be '$24.99/mo'")
        self.assertEqual(creator["delivery"], "Priority", "Creator Pack delivery should be 'Priority'")
        
        print("✅ Plans endpoint test passed")
    
    def test_03_generate_orders(self):
        """Test order generation endpoint for all plans"""
        print("\n🔍 Testing order generation endpoint for all plans...")
        
        # Test snap plan
        payload = {"plan": "snap"}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 200, "Order generation for snap should return 200")
        data = response.json()
        self.assertTrue("orderId" in data, "Response should include orderId")
        self.assertEqual(data["plan"], "snap", "Plan should be 'snap'")
        self.assertEqual(data["price"], "$3.99", "Price should be '$3.99'")
        self.assertTrue("timestamp" in data, "Response should include timestamp")
        self.assertTrue("whatsappNumber" in data, "Response should include whatsappNumber")
        
        # Save order ID for later tests
        self.order_ids["snap"] = data["orderId"]
        print(f"✅ Snap order generation test passed - Created order ID: {data['orderId']}")
        
        # Test snappack plan
        payload = {"plan": "snappack"}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 200, "Order generation for snappack should return 200")
        data = response.json()
        self.assertEqual(data["plan"], "snappack", "Plan should be 'snappack'")
        self.assertEqual(data["price"], "$9.99", "Price should be '$9.99'")
        
        # Save order ID for later tests
        self.order_ids["snappack"] = data["orderId"]
        print(f"✅ Snap Pack order generation test passed - Created order ID: {data['orderId']}")
        
        # Test creator plan
        payload = {"plan": "creator"}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 200, "Order generation for creator should return 200")
        data = response.json()
        self.assertEqual(data["plan"], "creator", "Plan should be 'creator'")
        self.assertEqual(data["price"], "$24.99/mo", "Price should be '$24.99/mo'")
        
        # Save order ID for later tests
        self.order_ids["creator"] = data["orderId"]
        print(f"✅ Creator Pack order generation test passed - Created order ID: {data['orderId']}")
        
        # Test invalid plan
        payload = {"plan": "invalid_plan"}
        response = requests.post(f"{self.base_url}/api/generate-order", json=payload)
        
        self.assertEqual(response.status_code, 400, "Invalid plan should return 400")
        print("✅ Invalid plan test passed")
    
    def test_04_get_orders(self):
        """Test get order by ID endpoint for all plans"""
        print("\n🔍 Testing get order endpoint for all plans...")
        
        # Test snap order
        if "snap" not in self.order_ids:
            self.skipTest("No snap order ID available from previous test")
        
        response = requests.get(f"{self.base_url}/api/order/{self.order_ids['snap']}")
        
        self.assertEqual(response.status_code, 200, "Get snap order should return 200")
        data = response.json()
        self.assertEqual(data["orderId"], self.order_ids["snap"], "Order ID should match")
        self.assertEqual(data["plan"], "snap", "Plan should be 'snap'")
        self.assertEqual(data["planName"], "Snap", "Plan name should be 'Snap'")
        self.assertEqual(data["price"], "$3.99", "Price should be '$3.99'")
        self.assertEqual(data["delivery"], "2 hours", "Delivery should be '2 hours'")
        self.assertEqual(data["status"], "payment_confirmed", "Status should be 'payment_confirmed'")
        self.assertEqual(data["fulfilled"], False, "Fulfilled should be False")
        print("✅ Get snap order test passed")
        
        # Test snappack order
        if "snappack" not in self.order_ids:
            self.skipTest("No snappack order ID available from previous test")
        
        response = requests.get(f"{self.base_url}/api/order/{self.order_ids['snappack']}")
        
        self.assertEqual(response.status_code, 200, "Get snappack order should return 200")
        data = response.json()
        self.assertEqual(data["plan"], "snappack", "Plan should be 'snappack'")
        self.assertEqual(data["planName"], "Snap Pack", "Plan name should be 'Snap Pack'")
        self.assertEqual(data["price"], "$9.99", "Price should be '$9.99'")
        self.assertEqual(data["delivery"], "48 hours each", "Delivery should be '48 hours each'")
        print("✅ Get snappack order test passed")
        
        # Test creator order
        if "creator" not in self.order_ids:
            self.skipTest("No creator order ID available from previous test")
        
        response = requests.get(f"{self.base_url}/api/order/{self.order_ids['creator']}")
        
        self.assertEqual(response.status_code, 200, "Get creator order should return 200")
        data = response.json()
        self.assertEqual(data["plan"], "creator", "Plan should be 'creator'")
        self.assertEqual(data["planName"], "Creator Pack", "Plan name should be 'Creator Pack'")
        self.assertEqual(data["price"], "$24.99/mo", "Price should be '$24.99/mo'")
        self.assertEqual(data["delivery"], "Priority", "Delivery should be 'Priority'")
        print("✅ Get creator order test passed")
        
        # Test non-existent order
        response = requests.get(f"{self.base_url}/api/order/non-existent-id")
        
        self.assertEqual(response.status_code, 404, "Non-existent order should return 404")
        print("✅ Non-existent order test passed")
    
    def test_05_list_orders(self):
        """Test get all orders endpoint with filters"""
        print("\n🔍 Testing list orders endpoint with filters...")
        
        response = requests.get(f"{self.base_url}/api/orders")
        
        self.assertEqual(response.status_code, 200, "Get orders should return 200")
        data = response.json()
        self.assertTrue("orders" in data, "Response should include orders array")
        self.assertTrue("count" in data, "Response should include count")
        self.assertTrue(isinstance(data["orders"], list), "Orders should be a list")
        self.assertTrue(data["count"] > 0, "There should be at least one order")
        print(f"✅ List orders test passed - Found {data['count']} orders")
        
        # Test with limit parameter
        limit = 2
        response = requests.get(f"{self.base_url}/api/orders?limit={limit}")
        
        self.assertEqual(response.status_code, 200, "Get orders with limit should return 200")
        data = response.json()
        self.assertTrue(len(data["orders"]) <= limit, f"Should return at most {limit} orders")
        print(f"✅ List orders with limit test passed")
        
        # Test with fulfilled filter
        response = requests.get(f"{self.base_url}/api/orders?fulfilled=false")
        
        self.assertEqual(response.status_code, 200, "Get unfulfilled orders should return 200")
        data = response.json()
        if data["count"] > 0:
            self.assertEqual(data["orders"][0]["fulfilled"], False, "Should only return unfulfilled orders")
        print("✅ List orders with fulfilled filter test passed")
        
        # Test with plan filter
        response = requests.get(f"{self.base_url}/api/orders?plan=snap")
        
        self.assertEqual(response.status_code, 200, "Get snap orders should return 200")
        data = response.json()
        if data["count"] > 0:
            self.assertEqual(data["orders"][0]["plan"], "snap", "Should only return snap orders")
        print("✅ List orders with plan filter test passed")
    
    def test_06_fulfill_order(self):
        """Test fulfill order endpoint"""
        print("\n🔍 Testing fulfill order endpoint...")
        
        # Skip if no snap order ID from previous test
        if "snap" not in self.order_ids:
            self.skipTest("No snap order ID available from previous test")
        
        response = requests.put(f"{self.base_url}/api/order/{self.order_ids['snap']}/fulfill")
        
        self.assertEqual(response.status_code, 200, "Fulfill order should return 200")
        data = response.json()
        self.assertEqual(data["message"], "Order fulfilled successfully", "Should return success message")
        self.assertEqual(data["orderId"], self.order_ids["snap"], "Order ID should match")
        print("✅ Fulfill order test passed")
        
        # Verify order is now fulfilled
        response = requests.get(f"{self.base_url}/api/order/{self.order_ids['snap']}")
        
        self.assertEqual(response.status_code, 200, "Get order should return 200")
        data = response.json()
        self.assertEqual(data["fulfilled"], True, "Order should now be fulfilled")
        self.assertTrue("fulfilledAt" in data, "Should include fulfilledAt timestamp")
        print("✅ Order fulfillment verification passed")
        
        # Test non-existent order
        response = requests.put(f"{self.base_url}/api/order/non-existent-id/fulfill")
        
        self.assertEqual(response.status_code, 404, "Non-existent order should return 404")
        print("✅ Non-existent order fulfillment test passed")
    
    def test_07_stats(self):
        """Test stats endpoint"""
        print("\n🔍 Testing stats endpoint...")
        
        response = requests.get(f"{self.base_url}/api/stats")
        
        self.assertEqual(response.status_code, 200, "Stats should return 200")
        data = response.json()
        self.assertTrue("totalOrders" in data, "Response should include totalOrders")
        self.assertTrue("fulfilledOrders" in data, "Response should include fulfilledOrders")
        self.assertTrue("pendingOrders" in data, "Response should include pendingOrders")
        self.assertTrue("planBreakdown" in data, "Response should include planBreakdown")
        
        plan_breakdown = data["planBreakdown"]
        self.assertTrue("snap" in plan_breakdown, "Plan breakdown should include 'snap'")
        self.assertTrue("snappack" in plan_breakdown, "Plan breakdown should include 'snappack'")
        self.assertTrue("creator" in plan_breakdown, "Plan breakdown should include 'creator'")
        
        # Verify that total orders equals fulfilled + pending
        self.assertEqual(
            data["totalOrders"], 
            data["fulfilledOrders"] + data["pendingOrders"],
            "Total orders should equal fulfilled + pending"
        )
        print("✅ Stats endpoint test passed")

if __name__ == "__main__":
    unittest.main()
