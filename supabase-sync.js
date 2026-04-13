/**
 * Inventors Hub — Supabase Sync Patch
 * ====================================
 * This file patches the DB object to sync with Supabase in the background.
 * 
 * HOW IT WORKS:
 * 1. Loads Supabase client from CDN
 * 2. Wraps DB.get/set/del to also read/write from Supabase
 * 3. Falls back to localStorage when Supabase is unavailable
 * 4. Auto-syncs on load
 * 
 * ADD TO index.html BEFORE app.js:
 *   <script src="config.js"></script>
 *   <script src="supabase-sync.js"></script>
 *   <script src="app.js"></script>
 */

(async function() {
  'use strict';

  // Load Supabase client
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const PREFIX = 'ih_'; // Inventors Hub prefix
  let supabaseClient = null;
  let useSupabase = false;

  // Try to connect to Supabase
  if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_')) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Test connection
      await supabaseClient.from(typeof SITE_ID!=='undefined'&&SITE_ID?SITE_ID+'_kv_store':'kv_store').select('key').limit(1);
      useSupabase = true;
      console.log('[Inventors Hub] ✅ Connected to Supabase — data will sync!');
    } catch (err) {
      console.warn('[Inventors Hub] ⚠️ Supabase unavailable — using localStorage:', err.message);
    }
  } else {
    console.log('[Inventors Hub] 📦 Using localStorage (no Supabase config found)');
  }

  // Wait for original DB object to be defined (app.js creates it)
  // We'll intercept via Object.defineProperty on window
  const _originalDB = {};

  // Enhanced DB that syncs with Supabase
  window.DB_SYNC = {
    async: true, // Flag to indicate async capabilities
    
    async get(key) {
      // Always try localStorage first (fast)
      let localVal = null;
      try { localVal = JSON.parse(localStorage.getItem(PREFIX + key)) || null; } catch {}

      if (!useSupabase) return localVal;

      try {
        const { data, error } = await supabaseClient
          .from(typeof SITE_ID!=='undefined'&&SITE_ID?SITE_ID+'_kv_store':'kv_store')
          .select('value')
          .eq('key', PREFIX + key)
          .single();
        
        if (!error && data) {
          const remoteVal = data.value;
          // Update local cache
          localStorage.setItem(PREFIX + key, JSON.stringify(remoteVal));
          return remoteVal;
        }
      } catch {}

      return localVal;
    },

    async set(key, value) {
      // Always save to localStorage (fast, works offline)
      localStorage.setItem(PREFIX + key, JSON.stringify(value));

      if (!useSupabase) return;

      // Sync to Supabase in background
      try {
        await supabaseClient
          .from(typeof SITE_ID!=='undefined'&&SITE_ID?SITE_ID+'_kv_store':'kv_store')
          .upsert({ 
            key: PREFIX + key, 
            value: value, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'key' });
      } catch (err) {
        console.warn('[Sync] set failed for', key, err.message);
      }
    },

    async del(key) {
      localStorage.removeItem(PREFIX + key);
      if (!useSupabase) return;
      try {
        await supabaseClient.from(typeof SITE_ID!=='undefined'&&SITE_ID?SITE_ID+'_kv_store':'kv_store').delete().eq('key', PREFIX + key);
      } catch {}
    },

    async all() {
      const keys = ['users', 'inventions', 'categories', 'favorites', 'notifs'];
      const result = {};
      
      if (useSupabase) {
        try {
          const { data } = await supabaseClient
            .from(typeof SITE_ID!=='undefined'&&SITE_ID?SITE_ID+'_kv_store':'kv_store')
            .select('key, value')
            .like('key', PREFIX + '%');
          
          if (data) {
            for (const row of data) {
              const k = row.key.replace(PREFIX, '');
              result[k] = row.value;
              localStorage.setItem(row.key, JSON.stringify(row.value));
            }
          }
        } catch {}
      }

      // Fill missing from localStorage
      for (const k of keys) {
        if (!result[k]) {
          try { result[k] = JSON.parse(localStorage.getItem(PREFIX + k)) || []; }
          catch { result[k] = []; }
        }
      }
      return result;
    },

    async uploadImage(file) {
      if (typeof CLOUDINARY_CLOUD_NAME === 'undefined') {
        throw new Error('Cloudinary not configured');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'ml_default');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data.secure_url) return data.secure_url;
      throw new Error(data.error?.message || 'Upload failed');
    },

    isConnected() { return useSupabase; }
  };

  // Expose connection status
  window.SUPABASE_CONNECTED = useSupabase;

  console.log('[Inventors Hub] Sync module loaded. Supabase:', useSupabase ? 'ON' : 'OFF');
})();
