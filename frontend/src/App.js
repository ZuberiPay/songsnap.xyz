import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [adminData, setAdminData] = useState({ orders: [], stats: {} });
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check if we're on success page or admin page
  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const plan = urlParams.get('plan');
      const admin = urlParams.get('admin');
      
      console.log('URL Params:', { success, plan, admin }); // Debug log
      
      if (admin === 'true') {
        setShowAdmin(true);
      } else if (success === 'true' && plan) {
        generateOrder(plan);
      }
    };
    
    checkUrlParams();
    
    // Also listen for URL changes
    window.addEventListener('popstate', checkUrlParams);
    return () => window.removeEventListener('popstate', checkUrlParams);
  }, []);

  const generateOrder = async (plan) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      setOrderData(data);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error generating order:', error);
    }
  };

  const handleAdminLogin = () => {
    // Simple password check - in production, use proper authentication
    if (adminPassword === 'songsnaps2024') {
      setIsAdminAuthenticated(true);
      loadAdminData();
    } else {
      alert('Invalid password');
    }
  };

  const loadAdminData = async () => {
    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders?limit=100`),
        fetch(`${API_BASE_URL}/api/stats`)
      ]);
      
      const ordersData = await ordersResponse.json();
      const statsData = await statsResponse.json();
      
      setAdminData({ orders: ordersData.orders, stats: statsData });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const fulfillOrder = async (orderId) => {
    try {
      await fetch(`${API_BASE_URL}/api/order/${orderId}/fulfill`, {
        method: 'PUT',
      });
      loadAdminData(); // Reload data
    } catch (error) {
      console.error('Error fulfilling order:', error);
    }
  };

  const handlePayment = (plan) => {
    // For MVP testing, simulate immediate success instead of external redirect
    // In production, you would replace these URLs with actual Stripe payment links
    
    const planDetails = {
      snap: 'Snap ($3.99) - 1 song in 2 hours',
      snappack: 'Snap Pack ($9.99) - 3 songs over 7 days',
      creator: 'Creator Pack ($24.99/month) - Up to 10 songs per month'
    };
    
    const confirmPayment = window.confirm(
      `This is a demo. In production, you would be redirected to Stripe to pay for ${planDetails[plan]}. Click OK to simulate successful payment.`
    );
    
    if (confirmPayment) {
      // Simulate successful payment by calling generateOrder directly
      generateOrder(plan);
    }
  };

  const handleWhatsAppRedirect = () => {
    if (!orderData) return;
    
    const planDescriptions = {
      snap: 'a Snap (single song)',
      snappack: 'a Snap Pack (3 songs)',
      creator: 'a Creator Pack subscription'
    };
    
    const deliveryTimes = {
      snap: '2 hours',
      snappack: '48 hours for each song',
      creator: 'priority delivery'
    };
    
    const message = `Hi! I just purchased ${planDescriptions[orderData.plan] || 'a custom song package'}. My order ID is: ${orderData.orderId}. Expected delivery: ${deliveryTimes[orderData.plan] || '2 hours'}. I'm excited to share my song idea with you! 🎵`;
    const encodedMessage = encodeURIComponent(message);
    
    // Replace +1234567890 with your actual WhatsApp number
    const whatsappUrl = `https://wa.me/1234567890?text=${encodedMessage}`;
    
    console.log('WhatsApp URL:', whatsappUrl); // Debug log
    window.open(whatsappUrl, '_blank');
  };

  // Audio player controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Admin Dashboard Component
  if (showAdmin) {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Admin Access</h1>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <button
              onClick={handleAdminLogin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
            >
              Access Dashboard
            </button>
            <button
              onClick={() => {
                setShowAdmin(false);
                window.history.pushState({}, '', '/');
              }}
              className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">SongSnaps Admin Dashboard</h1>
              <div className="space-x-4">
                <button
                  onClick={loadAdminData}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setShowAdmin(false);
                    setIsAdminAuthenticated(false);
                    window.history.pushState({}, '', '/');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  ← Back to Site
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">{adminData.stats.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Orders</h3>
              <p className="text-3xl font-bold text-yellow-600">{adminData.stats.pendingOrders || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Fulfilled Orders</h3>
              <p className="text-3xl font-bold text-green-600">{adminData.stats.fulfilledOrders || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">
                ${((adminData.stats.planBreakdown?.snap || 0) * 3.99 + 
                   (adminData.stats.planBreakdown?.snappack || 0) * 9.99 + 
                   (adminData.stats.planBreakdown?.creator || 0) * 24.99).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">🤳 Snap Orders</p>
                <p className="text-2xl font-bold text-pink-600">{adminData.stats.planBreakdown?.snap || 0}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">🎁 Snap Pack Orders</p>
                <p className="text-2xl font-bold text-yellow-600">{adminData.stats.planBreakdown?.snappack || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">💼 Creator Pack Orders</p>
                <p className="text-2xl font-bold text-purple-600">{adminData.stats.planBreakdown?.creator || 0}</p>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminData.orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{order.orderId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.planName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.fulfilled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.fulfilled ? 'Fulfilled' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!order.fulfilled && (
                          <button
                            onClick={() => fulfillOrder(order.orderId)}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition-all duration-300"
                          >
                            Mark Fulfilled
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success Page
  if (showSuccess && orderData) {
    const planDetails = {
      snap: { name: 'Snap', price: '$3.99', description: '1 full-length custom song' },
      snappack: { name: 'Snap Pack', price: '$9.99', description: '3 songs over 7 days' },
      creator: { name: 'Creator Pack', price: '$24.99/mo', description: 'Up to 10 songs per month' }
    };

    const currentPlan = planDetails[orderData.plan] || { name: 'Custom Plan', price: 'N/A', description: 'Custom package' };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Order Details</h3>
            <p className="text-sm text-gray-600">Order ID: <span className="font-mono font-bold">{orderData.orderId}</span></p>
            <p className="text-sm text-gray-600">Plan: <span className="font-bold">{currentPlan.name}</span> ({currentPlan.price})</p>
            <p className="text-xs text-gray-500 mt-1">{currentPlan.description}</p>
            
            {orderData.plan === 'snap' && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-800">🎵 Includes simple cover art</p>
                <p className="text-xs text-blue-800">⏰ Delivered in 2 hours</p>
              </div>
            )}
            
            {orderData.plan === 'snappack' && (
              <div className="mt-2 p-2 bg-purple-50 rounded">
                <p className="text-xs text-purple-800">🎁 3 unique songs</p>
                <p className="text-xs text-purple-800">⏰ Delivered within 48 hours each</p>
              </div>
            )}
            
            {orderData.plan === 'creator' && (
              <div className="mt-2 p-2 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-800">🎹 Includes AI stems & instrumentals</p>
                <p className="text-xs text-yellow-800">📱 TikTok-ready 30s clips</p>
                <p className="text-xs text-yellow-800">⚡ Priority delivery</p>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-6">
            Click below to start chatting with us on WhatsApp and share your song idea!
          </p>
          
          <button
            onClick={handleWhatsAppRedirect}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg mb-4 whatsapp-btn"
          >
            <span className="flex items-center justify-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Continue to WhatsApp
            </span>
          </button>
          
          <button
            onClick={() => {
              setShowSuccess(false);
              setOrderData(null);
              window.history.pushState({}, '', '/');
            }}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300"
          >
            ← Back to Home
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            {orderData.plan === 'snap' && 'Expected delivery: Within 2 hours'}
            {orderData.plan === 'snappack' && 'Expected delivery: 48 hours per song'}
            {orderData.plan === 'creator' && 'Priority delivery for all songs'}
          </p>
        </div>
      </div>
    );
  }

  // Main Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.pexels.com/photos/8512209/pexels-photo-8512209.jpeg')`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
              Your Story,<br />
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Your Song
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto animate-fade-in-up-delay">
              Text us your mood, idea, or lyrics. Get full AI-generated songs back fast. 
              No studio needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up-delay-2">
              <button
                onClick={() => handlePayment('snap')}
                className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                🤳 Get Your Snap - $3.99
              </button>
              <button
                onClick={() => handlePayment('snappack')}
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-purple-900 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:shadow-2xl"
              >
                🎁 Snap Pack - $9.99
              </button>
            </div>
            
            {/* Admin Access and Test Buttons */}
            <div className="mt-8 space-y-2">
              <button
                onClick={() => {
                  window.history.pushState({}, '', '?success=true&plan=snap');
                  window.location.reload();
                }}
                className="block mx-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm transition-all duration-300"
              >
                🧪 Test Success Page (Demo)
              </button>
              <button
                onClick={() => {
                  window.history.pushState({}, '', '?admin=true');
                  window.location.reload();
                }}
                className="block mx-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm transition-all duration-300"
              >
                👑 Admin Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-pink-500 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-1/4 right-10 w-16 h-16 bg-yellow-500 rounded-full opacity-20 animate-float-delay"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-purple-500 rounded-full opacity-30 animate-float-delay-2"></div>
      </div>

      {/* Sample Audio Section */}
      <div className="py-20 bg-white bg-opacity-10 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 animate-fade-in">Listen to the Magic</h2>
            <p className="text-lg sm:text-xl text-gray-200 animate-fade-in-delay">Sample songs created for our customers</p>
          </div>
          
          {/* Audio Player */}
          <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl animate-fade-in-up">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-lg truncate">Sample Love Song</h3>
                <p className="text-gray-300 text-sm truncate">Created for Sarah & Mike</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-purple-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-purple-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div
                  className="w-full bg-white bg-opacity-30 rounded-full h-2 cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-300 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            >
              <source src="/sample-song.mp3" type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 animate-fade-in">Choose Your Plan</h2>
            <p className="text-lg sm:text-xl text-gray-200 animate-fade-in-delay">From quick vibes to creator-level content</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Snap Plan */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-6 lg:p-8 border border-white border-opacity-20 hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in-up">
              <div className="text-center">
                <div className="text-4xl mb-4">🤳</div>
                <h3 className="text-2xl font-bold text-white mb-2">Snap</h3>
                <div className="text-4xl font-bold text-white mb-2">$3.99</div>
                <p className="text-gray-300 mb-6 italic text-sm sm:text-base">"Text me your mood, idea, or a line of lyrics. Get a full AI-generated song back in 2 hours."</p>
                
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    1 full-length custom song
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Includes simple cover art
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Delivered via WhatsApp in 2 hours
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    No edits or extras
                  </div>
                </div>
                
                <button
                  onClick={() => handlePayment('snap')}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Get Your Snap
                </button>
              </div>
            </div>

            {/* Snap Pack Plan */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-6 lg:p-8 border-2 border-yellow-400 border-opacity-50 hover:scale-105 transition-all duration-300 relative hover:shadow-2xl animate-fade-in-up-delay">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-full text-sm font-bold">POPULAR</span>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-white mb-2">Snap Pack</h3>
                <div className="text-4xl font-bold text-white mb-2">$9.99</div>
                <p className="text-gray-300 mb-6 italic text-sm sm:text-base">"Need more than one song? Get 3 unique AI tracks."</p>
                
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    3 songs over 7 days
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Different moods, vibes, or lyrics
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Delivered within 48 hours each
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Includes cover art for each
                  </div>
                </div>
                
                <button
                  onClick={() => handlePayment('snappack')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Get Snap Pack
                </button>
              </div>
            </div>

            {/* Creator Pack Plan */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-6 lg:p-8 border border-white border-opacity-20 hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in-up-delay-2">
              <div className="text-center">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-2xl font-bold text-white mb-2">Creator Pack</h3>
                <div className="text-4xl font-bold text-white mb-2">$24.99<span className="text-lg text-gray-300">/mo</span></div>
                <p className="text-gray-300 mb-6 italic text-sm sm:text-base">"For creators who want sound without a studio."</p>
                
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Up to 10 custom songs per month
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    AI stems & instrumentals
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    TikTok-ready 30s clips
                  </div>
                  <div className="flex items-center text-sm text-gray-200">
                    <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Priority WhatsApp delivery
                  </div>
                </div>
                
                <button
                  onClick={() => handlePayment('creator')}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Creating
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white bg-opacity-5 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 animate-fade-in">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-200 animate-fade-in-delay">From idea to song in just a few steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Choose & Pay</h3>
              <p className="text-gray-300">Pick your plan and pay securely. $3.99 gets you started instantly.</p>
            </div>
            
            <div className="text-center animate-fade-in-up-delay">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Share Your Vibe</h3>
              <p className="text-gray-300">Text us your mood, memories, or lyrics on WhatsApp. Be as creative as you want!</p>
            </div>
            
            <div className="text-center animate-fade-in-up-delay-2">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Get Your Song</h3>
              <p className="text-gray-300">Receive your personalized AI song with cover art. Ready to share!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 border-t border-white border-opacity-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">SongSnaps</h3>
          <p className="text-gray-300">Your story, your song. No studio needed.</p>
        </div>
      </div>
    </div>
  );
}

export default App;