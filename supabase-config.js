const SUPABASE_URL = "https://umflohaswnlwzrqbzmxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZmxvaGFzd25sd3pycWJ6bXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjMwMDMsImV4cCI6MjA4ODc5OTAwM30.XH45rX-2RW_gDAnN4gAm3O-P_b9jRyyvmoy2iuwJrfA";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BqSIT0GcmJ54v0PHVf7Hxw_COvYC9L7";

(function initDigitQuoAuth(global) {
  const supabaseSdk = global.supabase;

  function hasValidConfig() {
    return (
      typeof SUPABASE_URL === "string" &&
      typeof SUPABASE_ANON_KEY === "string" &&
      SUPABASE_URL.startsWith("https://") &&
      !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
      !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
    );
  }

  function normalizeUser(user) {
    if (!user) {
      return null;
    }

    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email || "",
      fullName: metadata.full_name || metadata.fullName || user.email || "User",
      phone: metadata.phone || "",
      profilePhoto: metadata.profile_photo || metadata.profilePhoto || "",
    };
  }

  function setDisplay(element, visible, visibleDisplay) {
    if (!element) {
      return;
    }

    element.style.display = visible ? visibleDisplay : "none";
  }

  const auth = {
    client: null,
    isConfigured: hasValidConfig,
    async getClient() {
      if (!hasValidConfig()) {
        return null;
      }

      if (!supabaseSdk || typeof supabaseSdk.createClient !== "function") {
        throw new Error("Supabase SDK not loaded.");
      }

      if (!this.client) {
        this.client = supabaseSdk.createClient(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
          }
        );
        global.supabaseClient = this.client;
      }

      return this.client;
    },
    async getSession() {
      const client = await this.getClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.auth.getSession();
      if (error) {
        return null;
      }

      return data.session || null;
    },
    async getCurrentUser() {
      const session = await this.getSession();
      if (!session) {
        return null;
      }

      return normalizeUser(session.user);
    },
    async signOut() {
      const client = await this.getClient();
      if (!client) {
        return;
      }

      await client.auth.signOut();
    },
  };

  const authExtended = {
    ...auth,
    async getUserProfile(userId) {
      const client = await this.getClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
      return error ? null : data;
    },
    async getCurrentProfile() {
      const session = await this.getSession();
      if (!session) {
        return null;
      }

      return this.getUserProfile(session.user.id);
    },
    async isAdmin(userId) {
      const profile = await this.getUserProfile(userId);
      return Boolean(profile && profile.role === "admin" && profile.is_active !== false);
    },
    async checkAdminAccess() {
      const profile = await this.getCurrentProfile();
      return Boolean(profile && profile.role === "admin" && profile.is_active !== false);
    },
    async bindAdminUi(options = {}) {
      const {
        loginButtonId,
        adminButtonId,
        adminNavItemId,
        loginButtonDisplay = "inline-flex",
        adminButtonDisplay = "inline-flex",
        adminNavItemDisplay = "list-item",
      } = options;

      const loginButton = loginButtonId ? document.getElementById(loginButtonId) : null;
      const adminButton = adminButtonId ? document.getElementById(adminButtonId) : null;
      const adminNavItem = adminNavItemId ? document.getElementById(adminNavItemId) : null;

      const sync = async () => {
        const hasAdminAccess = await this.checkAdminAccess();
        setDisplay(loginButton, !hasAdminAccess, loginButtonDisplay);
        setDisplay(adminButton, hasAdminAccess, adminButtonDisplay);
        setDisplay(adminNavItem, hasAdminAccess, adminNavItemDisplay);
      };

      await sync();

      const client = await this.getClient();
      if (!client) {
        return null;
      }

      return client.auth.onAuthStateChange(() => {
        sync().catch((error) => {
          console.error("Error updating admin controls:", error);
        });
      });
    },
  };

  global.dqAuth = authExtended;
})(window);
