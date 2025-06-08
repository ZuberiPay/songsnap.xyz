import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Check if we're on success page
  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const plan = urlParams.get('plan');
      const express = urlParams.get('express');
      
      console.log('URL Params:', { success, plan, express }); // Debug log
      
      if (success === 'true' && plan) {
        generateOrder(plan, express === 'true');
      }
    };
    
    checkUrlParams();
    
    // Also listen for URL changes
    window.addEventListener('popstate', checkUrlParams);
    return () => window.removeEventListener('popstate', checkUrlParams);
  }, []);

  const generateOrder = async (plan, express) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, express: express === 'true' }),
      });
      const data = await response.json();
      setOrderData(data);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error generating order:', error);
    }
  };

  const handlePayment = (plan, isExpress = false) => {
    // For MVP testing, simulate immediate success instead of external redirect
    // In production, you would replace these URLs with actual Stripe payment links
    
    const confirmPayment = window.confirm(
      `This is a demo. In production, you would be redirected to Stripe to pay for ${plan} ${isExpress ? '+ express' : ''}. Click OK to simulate successful payment.`
    );
    
    if (confirmPayment) {
      // Simulate successful payment by calling generateOrder directly
      generateOrder(plan, isExpress);
    }
    
    // Alternative: Redirect to Stripe (uncomment for production)
    /*
    const successUrl = `${window.location.origin}?success=true&plan=${plan}&express=${isExpress}`;
    const paymentUrls = {
      subscription: `https://buy.stripe.com/test_subscription?success_url=${encodeURIComponent(successUrl)}`,
      oneoff: `https://buy.stripe.com/test_oneoff?success_url=${encodeURIComponent(successUrl)}`,
      express: `https://buy.stripe.com/test_express?success_url=${encodeURIComponent(successUrl)}`
    };
    
    let url;
    if (isExpress) {
      url = paymentUrls.express;
    } else {
      url = paymentUrls[plan];
    }
    
    window.location.href = url;
    */
  };

  const handleWhatsAppRedirect = () => {
    if (!orderData) return;
    
    const planText = orderData.plan === 'subscription' ? 'a SongSnaps subscription' : 
                     orderData.plan === 'express' ? 'an express custom song' : 'a custom song';
    const expressText = orderData.express ? ' with express delivery (30 minutes!)' : '';
    
    const message = `Hi! I just purchased ${planText}${expressText}. My order ID is: ${orderData.orderId}. I'm excited to share my song idea with you! 🎵`;
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

  if (showSuccess && orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Order Details</h3>
            <p className="text-sm text-gray-600">Order ID: <span className="font-mono font-bold">{orderData.orderId}</span></p>
            <p className="text-sm text-gray-600">Plan: <span className="capitalize">{orderData.plan === 'express' ? 'Express Song' : orderData.plan}</span></p>
            {orderData.express && <p className="text-sm text-gray-600">⚡ Express Delivery: ✅ (30 minutes)</p>}
            {!orderData.express && <p className="text-sm text-gray-600">🕐 Standard Delivery: Within 2 hours</p>}
          </div>
          
          <p className="text-gray-600 mb-6">
            Click below to start chatting with us on WhatsApp and share your song idea!
          </p>
          
          <button
            onClick={handleWhatsAppRedirect}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
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
            Expected delivery: Within 2 hours {orderData.express ? '(Express)' : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Your Story,<br />
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Your Song
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Transform your memories, emotions, and dreams into personalized AI-generated songs. 
              Delivered to your WhatsApp within 2 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handlePayment('subscription')}
                className="bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Get Started - $10/month
              </button>
              <button
                onClick={() => handlePayment('oneoff')}
                className="border-2 border-white text-white hover:bg-white hover:text-purple-900 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300"
              >
                Try Once - $5
              </button>
            </div>
            
            {/* URL Test Button - Remove in production */}
            <div className="mt-8">
              <button
                onClick={() => {
                  window.history.pushState({}, '', '?success=true&plan=subscription&express=false');
                  window.location.reload();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm"
              >
                🧪 Test Success Page (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Audio Section */}
      <div className="py-20 bg-white bg-opacity-10 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Listen to the Magic</h2>
            <p className="text-xl text-gray-200">Sample songs created for our customers</p>
          </div>
          
          {/* Audio Player */}
          <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Sample Love Song</h3>
                <p className="text-gray-300">Created for Sarah & Mike</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
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
              
              <div className="flex-1">
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
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-200">Perfect songs, delivered fast</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Subscription Plan */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-20 hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Monthly Magic</h3>
                <div className="text-4xl font-bold text-white mb-2">$10<span className="text-lg text-gray-300">/month</span></div>
                <p className="text-gray-300 mb-6">Up to 10 custom songs</p>
                <button
                  onClick={() => handlePayment('subscription')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Start Subscription
                </button>
              </div>
            </div>

            {/* One-off Plan */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-20 hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">One Perfect Song</h3>
                <div className="text-4xl font-bold text-white mb-2">$5<span className="text-lg text-gray-300">/song</span></div>
                <p className="text-gray-300 mb-6">Single custom creation</p>
                <button
                  onClick={() => handlePayment('oneoff')}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Create One Song
                </button>
              </div>
            </div>

            {/* Express Add-on */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 border border-yellow-400 border-opacity-50 hover:scale-105 transition-transform duration-300 md:col-span-2 lg:col-span-1">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Express Delivery</h3>
                <div className="text-4xl font-bold text-white mb-2">+$3</div>
                <p className="text-gray-300 mb-6">Get your song in 30 minutes</p>
                <button
                  onClick={() => handlePayment('express', true)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-yellow-500 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Rush My Song
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
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-200">From idea to song in just a few steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Choose & Pay</h3>
              <p className="text-gray-300">Select your plan and complete payment securely through Stripe</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Share Your Story</h3>
              <p className="text-gray-300">Tell us your story, memories, or emotions via WhatsApp</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Receive Your Song</h3>
              <p className="text-gray-300">Get your personalized AI-generated song within 2 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 border-t border-white border-opacity-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">SongSnaps</h3>
          <p className="text-gray-300">Transforming stories into songs, one beat at a time.</p>
        </div>
      </div>
    </div>
  );
}

export default App;