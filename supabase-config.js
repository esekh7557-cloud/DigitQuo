const SUPABASE_URL = "https://umflohaswnlwzrqbzmxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZmxvaGFzd25sd3pycWJ6bXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjMwMDMsImV4cCI6MjA4ODc5OTAwM30.XH45rX-2RW_gDAnN4gAm3O-P_b9jRyyvmoy2iuwJrfA";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BqSIT0GcmJ54v0PHVf7Hxw_COvYC9L7";

(function initDigtiQuoAuth(global) {
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

  const auth = {
    isConfigured: hasValidConfig,
    async getClient() {
      if (!hasValidConfig()) {
        return null;
      }

      if (!global.supabase || typeof global.supabase.createClient !== "function") {
        throw new Error("Supabase SDK not loaded.");
      }

      if (!this.client) {
        this.client = global.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
          }
        );
      }

      return this.client;
    },
    async getCurrentUser() {
      const client = await this.getClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        return null;
      }

      return normalizeUser(data.user);
    },
    async signOut() {
      const client = await this.getClient();
      if (!client) {
        return;
      }

      await client.auth.signOut();
    },
  };

  global.dqAuth = auth;
})(window);
