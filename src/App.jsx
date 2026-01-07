// LABEL: src/App.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { auth, db, rtdb } from './firebase';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onValue, ref, update } from "firebase/database";
import './App.css';

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { 
    if (center && center[0]) {
      setTimeout(() => map.invalidateSize(), 500);
      map.panTo(center);
    }
  }, [center]);
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inputDeviceId, setInputDeviceId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState({ lat: -7.741, lng: 110.426, speed: 0 });
  const [history, setHistory] = useState([]);
  const [intervalVal, setIntervalVal] = useState(5);
  const [sleepMode, setSleepMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false); 
  // interval dan sleep mode esp32
  // listen untuk stting dari rtdb
  useEffect(() => {
  if (!user || !deviceId) return;
  const setRef = ref(rtdb, `settings/${deviceId}`);
  onValue(setRef, (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      setIntervalVal(data.interval || 5);
      setSleepMode(data.sleep_mode || false);
    }
  });
  }, [user, deviceId]);
  //  update setting ke db
  const toggleSleep = () => {
  const newStatus = !sleepMode;
  setSleepMode(newStatus);
  update(ref(rtdb, `settings/${deviceId}`), { sleep_mode: newStatus });
  };
  // Monitor Auth (Firestore Sync)
  useEffect(() => {
      return onAuthStateChanged(auth, async (u) => {
        try {
          if (u) {
            setUser(u);
            const userDoc = await getDoc(doc(db, "users", u.uid));
            if (userDoc.exists()) setDeviceId(userDoc.data().deviceOwned);
          } else {
            setUser(null);
            setDeviceId("");
          }
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
      });
    }, []);
  
    // Monitor RTDB (Data GPS)
    useEffect(() => {
      if (!user || !deviceId) return;
      const locRef = ref(rtdb, `locations/${deviceId}/current`);
      onValue(locRef, (snap) => snap.exists() && setLocation(snap.val()));
      const histRef = ref(rtdb, `locations/${deviceId}/history`);
      onValue(histRef, (snap) => {
        if (snap.exists()) setHistory(Object.values(snap.val()));
      });
    }, [user, deviceId]);


  const handleAuth = async (type) => {
      try {
        if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
        else {
          if (!inputDeviceId) return alert("Device ID wajib diisi!");
          const res = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, "users", res.user.uid), { email, deviceOwned: inputDeviceId });
          setDeviceId(inputDeviceId);
        }
      } catch (e) { alert(e.message); }
    };


  // --- RENDERING LOGIC ---

  // Loading Layar Awal (Firebase Check)
  if (loading) return 
  <div className="pl">
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__dot"></div>
	<div className="pl__text">Loading…</div>
  </div>;

  // FORM LOGIN 
  if (!user) return (
    <div className="body">
    <div className="container">
      <input type="checkbox" id="signup_toggle" />
      <form className="form">
        <div className="form_front">
          <div className="form_details">Login</div>
          <input placeholder="Email" className="input" type="text" onChange={e => setEmail(e.target.value)}/>
          <input placeholder="Password" className="input" type="password" onChange={e => setPassword(e.target.value)}/>
          <button type="button" className="btn" onClick={() => handleAuth('login')}>
            Login
          </button>
          <span className="switch">
            Don't have an account?{" "}
            <label className="signup_tog" htmlFor="signup_toggle">
              Sign Up
            </label>
          </span>
        </div>
        {/* REGISTER */}
          <div className="form_back">
            <div className="form_details">Sign Up</div>
            <input placeholder="Device ID" className="input" type="text" onChange={e => setInputDeviceId(e.target.value)}/>
            <input placeholder="Email" className="input" type="text" onChange={e => setEmail(e.target.value)}/>
            <input placeholder="Password" className="input" type="password" onChange={e => setPassword(e.target.value)}/>
            <input placeholder="Confirm Password" className="input" type="password" onChange={e => setConfirm(e.target.value)}/>
            {confirm && password !== confirm && (<p className="match_error">Passwords do not match</p>)}
            {confirm && password === confirm && (<p className="match_success">Passwords match ✓</p>)}
            <button type="button" className="btn"  onClick={() =>{ if (password !== confirm) {; return;} handleAuth("reg")} }>
              Sign Up
            </button>
            <span className="switch">
              Already have an account?{" "}
              <label className="signup_tog" htmlFor="signup_toggle">
                Sign In
              </label>
            </span>
          </div>
      </form>
    </div>
    </div>
  );

  // Jika Sudah Login
  const {Recharts} = window; // Ambil dari CDN
  // Bagian Dashboard setelah Login

  return (
    <div className="skynet-app">
      {/* 1. SIDEBAR & DRAWER SYSTEM */}
      <aside className={`sidebar-v ${showHistory ? 'expanded' : ''}`}>
        
        <div className="icon-rail">
          <div className={`nav-item ${!showHistory ? 'active' : ''}`} onClick={() => setShowHistory(false)}>
            {/* Properti visual dipindah ke class nav-icon-svg */}
            <svg viewBox="0 0 24 24" className="nav-icon-svg">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <div className={`nav-item ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(true)}>
            <svg viewBox="0 0 24 24" className="nav-icon-svg">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="nav-item logout" onClick={() => signOut(auth)}>
            <svg viewBox="0 0 24 24" className="nav-icon-svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9"/>
            </svg>
          </div>
        </div>
        <div className="drawer-content">
          <div className="compact-card">
            <p className="card-label">Hardware Settings</p>
            <div className="config-row">
              <span className="config-text">Update Interval</span>
              <div className="input-group">
                <input 
                  type="number" className="input-lux" 
                  value={sleepMode ? 1800 : intervalVal} 
                  readOnly={sleepMode} 
                  onChange={(e) => !sleepMode && setIntervalVal(e.target.value)} 
                />
                <span className="unit-small">SEC</span>
              </div>
            </div>
            <button className={`btn-maps ${sleepMode ? 'btn-eco' : 'btn-live'}`} onClick={toggleSleep}>
              {sleepMode ? 'ECO MODE' : 'REALTIME MODE'}
            </button>
          </div>
          <div className="log-container">
            <p className="card-label">LOGS</p>
            <div className="custom-scroll">
              {history.slice(-15).reverse().map((pos, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-coord">[{pos.lat.toFixed(3)}, {pos.lng.toFixed(3)}]</span>
                  <span className="log-speed">{pos.speed.toFixed(1)} <small className="unit-dim">K/H</small></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
      {/* 2. MAIN MAP VIEWPORT */}
      <main className="main-viewport">
        <header className="top-header">
          <div className={`status-dot ${sleepMode ? 'state-eco' : 'state-live'}`}></div>
          <span className="header-title">SKYNET <span className="header-sub">// {sleepMode ? 'ECO' : 'LIVE'}</span></span>
        </header>
        <MapContainer center={[location.lat, location.lng]} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[location.lat, location.lng]} />
          <Polyline positions={history.map(p => [p.lat, p.lng])} color="var(--accent-lime)" weight={2} opacity={0.5} />
          <MapController center={[location.lat, location.lng]} />
        </MapContainer>
        {/* 3. UNIFIED HUD */}
        <div className="unified-hud">
          <div className="hud-section">
            <p className="card-label">SPEED</p>
            <div className="speed-display">
              {(location.speed || 0).toFixed(0)} <small className="unit-kmh">KM/H</small>
            </div>
          </div>
          <div className="hud-divider"></div>
          <div className="hud-section">
            <p className="card-label">Device ID</p>
            <p className="id-text">{deviceId.slice(-16)}</p>
            <a href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer" className="btn-maps">
              <svg viewBox="0 0 24 24" className="nav-icon-svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Open Navigation
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}